const summaryService = require("../services/summaryService");
const {
  extractTextFromDocument,
  extractTextFromUrl,
} = require("../lib/extractText");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

class SummaryController {
  async generateSummary(req, res) {
    try {
      const { content, options = {} } = req.body;
      const userId = req.user?.id;

      if (!content || content.trim().length < 50) {
        return res.status(400).json({
          error: "Content too short for summarization (minimum 50 characters)",
        });
      }

      // Generate content hash for caching
      const contentHash = crypto
        .createHash("sha256")
        .update(content + JSON.stringify(options))
        .digest("hex");

      // Check cache first
      const cached = await summaryService.getCachedSummary(contentHash, userId);
      if (cached) {
        return res.json({
          success: true,
          summary: JSON.parse(cached.summary_text),
          cached: true,
        });
      }

      // Generate new summary
      const summary = await summaryService.generateSummary(content, options);

      // Cache result
      if (userId) {
        await summaryService.cacheSummary(contentHash, summary, userId);
      }

      res.json({
        success: true,
        summary,
        cached: false,
      });
    } catch (error) {
      console.error("Summary generation error:", error);

      if (
        error.message.includes("RATE_LIMIT") ||
        error.message.includes("rate limit")
      ) {
        return res.status(429).json({
          error: "Rate limit exceeded. Please try again later.",
        });
      }

      res.status(500).json({
        error: "Failed to generate summary",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async summarizeDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { options = {} } = req.body;
      const userId = req.user?.id;

      // Get document content
      const document = await prisma.notes.findFirst({
        where: { id: parseInt(documentId) },
        // Note: Removed user_id check to allow viewing public/course notes
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Extract text from document
      let extractedText;
      try {
        extractedText = await extractTextFromDocument(document);
      } catch (extractError) {
        console.error("Text extraction error:", extractError);
        return res.status(400).json({
          error: "Failed to extract text from document",
          details:
            process.env.NODE_ENV === "development"
              ? extractError.message
              : undefined,
        });
      }

      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({
          error: "Insufficient text content for summarization",
        });
      }

      // Generate summary
      const summary = await summaryService.generateSummary(extractedText, {
        ...options,
        sourceType: "pdf",
      });

      res.json({
        success: true,
        summary,
        documentTitle: document.title,
        documentId: document.id,
      });
    } catch (error) {
      console.error("Document summarization error:", error);
      res.status(500).json({
        error: "Failed to summarize document",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async summarizeNote(req, res) {
    try {
      const { noteId } = req.params;
      const { options = {} } = req.body;
      const userId = req.user?.id;

      // Get note content
      const note = await prisma.notes.findFirst({
        where: {
          id: parseInt(noteId),
          // Allow public and course notes to be summarized
          OR: [
            { visibility: "public" },
            { visibility: "course_only" },
            { user_id: userId }, // Allow user's own private notes
          ],
        },
        include: {
          users: {
            select: {
              name: true,
              department: true,
            },
          },
        },
      });

      if (!note) {
        return res
          .status(404)
          .json({ error: "Note not found or access denied" });
      }

      // Extract text from the note file
      let extractedText;
      try {
        extractedText = await extractTextFromDocument(note);
      } catch (extractError) {
        console.error("Text extraction error:", extractError);
        return res.status(400).json({
          error: "Failed to extract text from note",
          details:
            process.env.NODE_ENV === "development"
              ? extractError.message
              : undefined,
        });
      }

      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({
          error: "Insufficient text content for summarization",
        });
      }

      // Generate summary
      const summary = await summaryService.generateSummary(extractedText, {
        ...options,
        sourceType: note.file_type || "note",
      });

      res.json({
        success: true,
        summary,
        noteTitle: note.title,
        noteId: note.id,
        author: note.users?.name,
      });
    } catch (error) {
      console.error("Note summarization error:", error);
      res.status(500).json({
        error: "Failed to summarize note",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new SummaryController();
