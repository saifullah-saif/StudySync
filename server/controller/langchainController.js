const langchainService = require("../services/langchainService");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const processFileFromUrl = async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({
        success: false,
        message: "fileUrl and fileName are required",
      });
    }

    console.log(`🔄 Processing file: ${fileName}`);

    const result = await langchainService.processFileFromUrl(fileUrl, fileName);

    res.status(200).json({
      success: true,
      message: "File processed successfully",
      data: {
        extractedText: result.text,
        pageCount: result.pageCount,
        wordCount: result.wordCount,
        qsAns: result.qsAns || [], // ✅ Include Q&A pairs
        // Send preview instead of full text for performance
        preview:
          result.text.substring(0, 1000) +
          (result.text.length > 1000 ? "..." : ""),
      },
    });
  } catch (error) {
    console.error("❌ Process file error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process file",
    });
  }
};

// Extract text from a document by document ID
const extractTextFromDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Get document details and verify user owns it
    const document = await prisma.notes.findFirst({
      where: {
        id: parseInt(documentId),
        user_id: userId,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied",
      });
    }

    // Get the file URL (signed URL from Supabase)
    const supabase = require("../lib/supabaseClient");
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || "study-sync-documents")
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (signedUrlError) {
      return res.status(500).json({
        success: false,
        message: "Failed to access document file",
      });
    }

    // Extract text using langchain service
    const result = await langchainService.processFileFromUrl(
      signedUrlData.signedUrl,
      document.file_name
    );

    res.status(200).json({
      success: true,
      message: "Text extracted successfully",
      data: {
        documentId: document.id,
        documentTitle: document.title,
        fileName: document.file_name,
        extractedText: result.text,
        pageCount: result.pageCount,
        wordCount: result.wordCount,
        charCount: result.text.length,
        // Send preview for quick display
        preview:
          result.text.substring(0, 1000) +
          (result.text.length > 1000 ? "..." : ""),
      },
    });
  } catch (error) {
    console.error("❌ Extract text from document error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to extract text from document",
    });
  }
};

module.exports = {
  processFileFromUrl,
  extractTextFromDocument,
};
