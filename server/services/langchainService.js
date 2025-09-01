const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const fs = require("fs").promises;
const path = require("path");
const simpleQAService = require("./simpleQAService");

class LangChainService {
  async extractPDFText(filePath) {
    try {
      console.log(`📄 Extracting PDF text from: ${filePath}`);

      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      if (!docs || docs.length === 0) {
        throw new Error("No content extracted from PDF");
      }

      // Combine all pages with proper newlines
      const fullText = docs.map((doc) => doc.pageContent).join("\n\n");

      console.log(`✅ Extracted ${fullText.length} characters from PDF`);
      console.log("\n📋 EXTRACTED PDF CONTENT:");
      console.log("=".repeat(50));
      console.log(fullText);
      console.log("=".repeat(50));

      let qsAns;
      try {
        console.log("� Generating Q&A using rule-based extraction...");

        // Use simple rule-based Q&A generation (no external API required)
        qsAns = simpleQAService.generateQAPairs(fullText, 8);

        // Print the generated Q&A pairs to console
        console.log("\n🎓 GENERATED Q&A PAIRS:");
        console.log("=".repeat(60));
        qsAns.forEach((item, index) => {
          console.log(`\n${index + 1}. Q: ${item.question}`);
          console.log(`   A: ${item.answer}`);
          console.log(`   Type: ${item.type || "general"}`);
        });
        console.log("=".repeat(60));
      } catch (error) {
        console.error("❌ Failed to generate Q&A:", error.message);

        // For now, continue without Q&A generation
        qsAns = [];
      }

      return {
        text: fullText,
        pageCount: docs.length,
        wordCount: fullText.split(" ").length,
        qsAns: qsAns || [], // Include generated Q&A pairs
        success: true,
      };
    } catch (error) {
      console.error("❌ PDF extraction error:", error);
      throw new Error(`Failed to extract PDF text: ${error.message}`);
    }
  }

  async processFileFromUrl(fileUrl, fileName) {
    let tempFilePath = null;

    try {
      // Download file to temp location
      console.log(`📥 Downloading file from: ${fileUrl}`);

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();

      // Create temp directory
      const tempDir = path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      // Save to temp file
      tempFilePath = path.join(tempDir, fileName);
      await fs.writeFile(tempFilePath, Buffer.from(buffer));

      // Extract text based on file type
      const fileExtension = path.extname(fileName).toLowerCase();

      if (fileExtension === ".pdf") {
        return await this.extractPDFText(tempFilePath);
      } else if (fileExtension === ".txt") {
        const textContent = await fs.readFile(tempFilePath, "utf-8");
        return {
          text: textContent,
          pageCount: 1,
          wordCount: textContent.split(" ").length,
          qsAns: [], // No Q&A generation for text files yet
          success: true,
        };
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (error) {
          console.warn("Failed to cleanup temp file:", error);
        }
      }
    }
  }
}

module.exports = new LangChainService();
