const { PrismaClient } = require("@prisma/client");
const supabase = require("../lib/supabaseClient");
const { extractTextFromFile, chunkText } = require("../lib/extractText");
const {
  generateFlashcards,
  deduplicateFlashcards,
} = require("../lib/openaiClient");
const uploadService = require("../lib/uploadService");

const prisma = new PrismaClient();

// Configure multer using centralized upload service
const upload = uploadService.createMulterConfig({
  allowedTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  allowedExtensions: [".pdf", ".docx", ".txt"],
  maxFileSize: 15 * 1024 * 1024, // 15MB limit
  validateFileName: true,
});

/**
 * Upload document to Supabase storage and create database record
 */
const uploadDocument = async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Upload using centralized upload service (private bucket with signed URL)
    const uploadResult = await uploadService.uploadFile(file, userId, {
      bucketName: process.env.SUPABASE_BUCKET_NAME || "study-sync-documents",
      isPublic: false, // Set to private for better security
      folderPath: `documents/${userId}`, // Organize documents in a dedicated folder
      upsert: false,
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: uploadResult.error || "Failed to upload file to storage",
      });
    }

    const { fileName, filePath, signedUrl } = uploadResult.data;

    // Create database record using notes table (since documents table doesn't exist)
    const document = await prisma.notes.create({
      data: {
        user_id: userId,
        title: title.trim(),
        description: `Uploaded document: ${file.originalname}`,
        file_name: file.originalname,
        file_path: fileName, // Use the fileName from upload service
        file_type: getFileTypeEnum(file.originalname),
        file_size_bytes: BigInt(file.size),
        visibility: "private",
        tags: ["document", "uploaded"],
        is_processed_by_ai: false,
      },
    });

    res.status(201).json({
      success: true,
      documentId: document.id,
      fileUrl: signedUrl, // Use signed URL for private files
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload document",
    });
  }
};

/**
 * Store pasted text as a document
 */
const pasteDocument = async (req, res) => {
  try {
    const { title, text } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!text || text.trim().length < 100) {
      return res.status(400).json({
        success: false,
        message: "Text must be at least 100 characters long",
      });
    }

    // Create database record with text content
    const document = await prisma.notes.create({
      data: {
        user_id: userId,
        title: title.trim(),
        description: "Pasted text content",
        file_name: `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`,
        file_path: `pasted_${Date.now()}.txt`,
        file_type: "txt",
        file_size_bytes: BigInt(text.length),
        visibility: "private",
        tags: ["document", "pasted"],
        is_processed_by_ai: true, // Mark as processed since we have the content
        // Store the content in document_chunks for easy retrieval
      },
    });

    // Store the text content in document_chunks
    await prisma.document_chunks.create({
      data: {
        document_id: document.id,
        chunk_text: text.trim(),
        chunk_order: 1,
        chunk_type: "full_text",
        word_count: text.trim().split(/\s+/).length,
        processed: true,
      },
    });

    res.status(201).json({
      success: true,
      documentId: document.id,
      message: "Text saved successfully",
    });
  } catch (error) {
    console.error("Paste document error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save text",
    });
  }
};

/**
 * Generate flashcards from document or text
 */
const generateFlashcardsFromDocument = async (req, res) => {
  try {
    const { documentId, text, deckTitle } = req.body;
    const userId = req.user.id;

    if (!documentId && !text) {
      return res.status(400).json({
        success: false,
        message: "Either documentId or text is required",
      });
    }

    let sourceText = text;
    let document = null;

    // If documentId is provided, verify ownership and extract text
    if (documentId) {
      document = await prisma.notes.findFirst({
        where: {
          id: documentId,
          user_id: userId,
        },
        include: {
          document_chunks: true,
        },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found or access denied",
        });
      }

      // Check if we already have processed text
      if (document.document_chunks.length > 0) {
        sourceText = document.document_chunks
          .sort((a, b) => a.chunk_order - b.chunk_order)
          .map((chunk) => chunk.chunk_text)
          .join("\n\n");
      } else {
        // Extract text from file
        sourceText = await extractTextFromDocument(document);
      }
    }

    if (!sourceText || sourceText.trim().length < 100) {
      return res.status(400).json({
        success: false,
        message: "Insufficient text content for flashcard generation",
      });
    }

    // Create generation job
    const job = await prisma.generation_jobs.create({
      data: {
        document_id: documentId || null,
        user_id: userId,
        status: "queued",
        created_at: new Date(),
      },
    });

    // Update job status to processing
    await prisma.generation_jobs.update({
      where: { id: job.id },
      data: {
        status: "processing",
        started_at: new Date(),
      },
    });

    try {
      // Generate flashcards
      let allFlashcards = [];

      // Chunk text if too large
      if (sourceText.length > 30000) {
        const chunks = chunkText(sourceText, 20000);

        for (const chunk of chunks) {
          const chunkCards = await generateFlashcards(chunk);
          allFlashcards.push(...chunkCards);
        }
      } else {
        allFlashcards = await generateFlashcards(sourceText);
      }

      // Deduplicate flashcards
      allFlashcards = deduplicateFlashcards(allFlashcards);

      if (allFlashcards.length === 0) {
        throw new Error(
          "No valid flashcards could be generated from the content"
        );
      }

      // Start database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create flashcard deck
        const deck = await tx.flashcard_decks.create({
          data: {
            user_id: userId,
            document_id: documentId || null,
            title:
              deckTitle || `Flashcards - ${document?.title || "Custom Text"}`,
            description: `AI-generated flashcards from ${
              document ? "uploaded document" : "pasted text"
            }`,
            creation_method: "ai_generated",
            is_public: false,
          },
        });

        // Create flashcards
        for (const cardData of allFlashcards) {
          const flashcard = await tx.flashcards.create({
            data: {
              deck_id: deck.id,
              question: cardData.question,
              answer: cardData.answer,
              difficulty_level: cardData.difficulty || 2,
              card_type: cardData.type || "basic",
              auto_generated: true,
              confidence_score: 0.85, // Default confidence for AI-generated cards
            },
          });

          // Create MCQ options if applicable
          if (
            cardData.type === "mcq" &&
            cardData.options &&
            cardData.options.length === 4
          ) {
            for (let i = 0; i < cardData.options.length; i++) {
              await tx.flashcard_options.create({
                data: {
                  flashcard_id: flashcard.id,
                  option_text: cardData.options[i],
                  is_correct: i === (cardData.correct_index || 0),
                  option_order: i,
                },
              });
            }
          }
        }

        // Update generation job
        await tx.generation_jobs.update({
          where: { id: job.id },
          data: {
            status: "completed",
            cards_generated: allFlashcards.length,
            completed_at: new Date(),
          },
        });

        // Mark document as processed if applicable
        if (document) {
          await tx.notes.update({
            where: { id: document.id },
            data: {
              is_processed_by_ai: true,
              last_modified: new Date(),
            },
          });
        }

        return { deckId: deck.id, cardsCreated: allFlashcards.length };
      });

      res.json({
        success: true,
        jobId: job.id,
        deckId: result.deckId,
        cardsCreated: result.cardsCreated,
        message: `Successfully generated ${result.cardsCreated} flashcards`,
      });
    } catch (error) {
      // Update job as failed
      await prisma.generation_jobs.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error_message: error.message,
          completed_at: new Date(),
        },
      });

      throw error;
    }
  } catch (error) {
    console.error("Generate flashcards error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate flashcards",
    });
  }
};

/**
 * Get flashcard deck details
 */
const getDeck = async (req, res) => {
  try {
    console.log("🔍 getDeck called with ID:", req.params.id);
    console.log("🔍 User:", req.user);

    const { id } = req.params;
    const userId = req.user.id;

    const deck = await prisma.flashcard_decks.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
      },
      include: {
        flashcards: {
          include: {
            flashcard_options: true,
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Deck not found or access denied",
      });
    }

    res.json({
      success: true,
      deck,
    });
  } catch (error) {
    console.error("Get deck error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve deck",
    });
  }
};

/**
 * Helper function to extract text from uploaded document
 */
async function extractTextFromDocument(document) {
  try {
    const bucketName =
      process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";

    // Download file using upload service
    const downloadResult = await uploadService.downloadFile(bucketName, document.file_path);

    if (!downloadResult.success) {
      throw new Error(`Failed to download file: ${downloadResult.error}`);
    }

    // Convert to buffer
    const arrayBuffer = await downloadResult.data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const extractedText = await extractTextFromFile(
      buffer,
      document.file_name,
      getMimeType(document.file_type)
    );

    // Store extracted text in chunks
    await prisma.document_chunks.create({
      data: {
        document_id: document.id,
        chunk_text: extractedText,
        chunk_order: 1,
        chunk_type: "full_text",
        word_count: extractedText.split(/\s+/).length,
        processed: true,
      },
    });

    return extractedText;
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

/**
 * Helper function to convert file extension to enum value
 */
function getFileTypeEnum(fileName) {
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    case "txt":
      return "txt";
    default:
      return "txt";
  }
}

/**
 * Helper function to get MIME type from file type enum
 */
function getMimeType(fileType) {
  switch (fileType) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "txt":
      return "text/plain";
    default:
      return "text/plain";
  }
}

module.exports = {
  upload,
  uploadDocument,
  pasteDocument,
  generateFlashcardsFromDocument,
  getDeck,
};
