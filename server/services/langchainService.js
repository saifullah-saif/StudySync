const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const fs = require("fs").promises;
const path = require("path");
const simpleQAService = require("./simpleQAService");

// AI Provider Setup - Only FREE providers for Q&A generation
let hasGroq = false;
let hasHuggingFace = false;
let groqClient = null;
let huggingfaceClient = null;

// Groq setup (FREE - 14,400 requests/day)
try {
  if (process.env.GROQ_API_KEY) {
    groqClient = require("../lib/groqClient");
    hasGroq = true;
    console.log("✅ Groq AI configured for Q&A generation");
  }
} catch (error) {
  console.log("⚠️ Groq client not available for Q&A");
}

// Hugging Face setup (FREE tier available)
try {
  if (process.env.HUGGINGFACE_API_KEY) {
    huggingfaceClient = require("../lib/huggingfaceClient");
    hasHuggingFace = true;
    console.log("✅ Hugging Face AI configured for Q&A generation (backup)");
  }
} catch (error) {
  console.log("⚠️ Hugging Face client not available for Q&A");
}

class LangChainService {
  async extractPDFText(filePath, options = {}) {
    const { generateQA = true, maxQAPairs = 8 } = options;

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

      // Generate Q&A pairs using AI providers (Groq > HuggingFace > Rule-based fallback)
      let qsAns = [];

      // Only generate Q&A if requested (for podcast feature)
      if (generateQA) {
        console.log(`🎯 Q&A generation requested: generating ${maxQAPairs} pairs...`);

        // Try Groq first (primary FREE provider)
        if (hasGroq) {
          try {
            console.log("🚀 Generating Q&A using Groq AI...");
            qsAns = await groqClient.generateQAPairsWithGroq(fullText, maxQAPairs);

            // Print the generated Q&A pairs to console
            console.log("\n🎓 GENERATED Q&A PAIRS (Groq):");
            console.log("=".repeat(60));
            qsAns.forEach((item, index) => {
              console.log(`\n${index + 1}. Q: ${item.question}`);
              console.log(`   A: ${item.answer}`);
              console.log(`   Type: ${item.type || "general"}`);
            });
            console.log("=".repeat(60));
          } catch (error) {
            console.error(`❌ Groq Q&A generation failed: ${error.message}`);
            console.log("🔄 Falling back to Hugging Face...");
          }
        }

        // Try Hugging Face as backup
        if (qsAns.length === 0 && hasHuggingFace) {
          try {
            console.log("🤗 Generating Q&A using Hugging Face AI...");
            qsAns = await huggingfaceClient.generateQAPairsWithHuggingFace(fullText, maxQAPairs);

            // Print the generated Q&A pairs to console
            console.log("\n🎓 GENERATED Q&A PAIRS (Hugging Face):");
            console.log("=".repeat(60));
            qsAns.forEach((item, index) => {
              console.log(`\n${index + 1}. Q: ${item.question}`);
              console.log(`   A: ${item.answer}`);
              console.log(`   Type: ${item.type || "general"}`);
            });
            console.log("=".repeat(60));
          } catch (error) {
            console.error(`❌ Hugging Face Q&A generation failed: ${error.message}`);
            console.log("🔄 Falling back to rule-based extraction...");
          }
        }

        // Only use rule-based as last resort fallback
        if (qsAns.length === 0) {
          try {
            console.log("⚠️ Both AI providers failed. Using rule-based extraction as fallback...");
            console.log("🧠 Generating Q&A using rule-based extraction...");

            qsAns = simpleQAService.generateQAPairs(fullText, maxQAPairs);

            // Print the generated Q&A pairs to console
            console.log("\n🎓 GENERATED Q&A PAIRS (Rule-based fallback):");
            console.log("=".repeat(60));
            qsAns.forEach((item, index) => {
              console.log(`\n${index + 1}. Q: ${item.question}`);
              console.log(`   A: ${item.answer}`);
              console.log(`   Type: ${item.type || "general"}`);
            });
            console.log("=".repeat(60));
          } catch (error) {
            console.error("❌ Rule-based Q&A generation also failed:", error.message);
            qsAns = [];
          }
        }
      } else {
        console.log("⏭️ Skipping Q&A generation (not requested)");
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

  async processFileFromUrl(fileUrl, fileName, options = {}) {
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
        return await this.extractPDFText(tempFilePath, options);
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
