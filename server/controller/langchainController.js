const langchainService = require("../services/langchainService");

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

module.exports = {
  processFileFromUrl,
};
