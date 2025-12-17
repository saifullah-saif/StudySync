const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const supabase = require("./supabaseClient");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Extract text from different file types
 * @param {Buffer} buffer - File buffer
 * @param {string} fileType - File type from database enum (pdf, docx, txt)
 * @param {string} fileName - Original filename (optional)
 * @param {string} mimeType - File MIME type (optional)
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(
  buffer,
  fileType,
  fileName = "",
  mimeType = ""
) {
  try {
    // Validate inputs
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid buffer provided");
    }

    if (buffer.length === 0) {
      throw new Error("Empty file buffer");
    }

    // Normalize file type
    const normalizedType = fileType.toLowerCase();
    const fileExt = fileName ? fileName.toLowerCase().split(".").pop() : "";

    // Handle PDF files
    if (
      normalizedType === "pdf" ||
      fileExt === "pdf" ||
      mimeType === "application/pdf"
    ) {
      try {
        const data = await pdf(buffer, {
          max: 0, // No page limit
          version: "v1.10.100", // Use specific version for consistency
        });

        if (!data.text || data.text.trim().length === 0) {
          throw new Error("No text content found in PDF");
        }

        return cleanText(data.text);
      } catch (pdfError) {
        throw new Error(`PDF extraction failed: ${pdfError.message}`);
      }
    }

    // Handle DOCX files
    if (
      normalizedType === "docx" ||
      fileExt === "docx" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });

        if (!result.value || result.value.trim().length === 0) {
          throw new Error("No text content found in DOCX file");
        }

        return cleanText(result.value);
      } catch (docxError) {
        throw new Error(`DOCX extraction failed: ${docxError.message}`);
      }
    }

    // Handle TXT files
    if (
      normalizedType === "txt" ||
      fileExt === "txt" ||
      mimeType === "text/plain"
    ) {
      try {
        const text = buffer.toString("utf8");

        if (!text || text.trim().length === 0) {
          throw new Error("No text content found in TXT file");
        }

        return cleanText(text);
      } catch (txtError) {
        throw new Error(`TXT extraction failed: ${txtError.message}`);
      }
    }

    throw new Error(
      `Unsupported file type: ${normalizedType}. Supported types: pdf, docx, txt`
    );
  } catch (error) {
    console.error("Text extraction error:", error);
    throw error;
  }
}

/**
 * Clean extracted text by removing excessive whitespace and common noise
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
  if (!text || typeof text !== "string") return "";

  // First, fix missing spaces between words (common PDF extraction issue)
  // Add space between lowercase letter and uppercase letter (camelCase fix)
  let cleaned = text.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Add space between letter and number
  cleaned = cleaned.replace(/([a-zA-Z])(\d)/g, "$1 $2");
  cleaned = cleaned.replace(/(\d)([a-zA-Z])/g, "$1 $2");

  // Add space after punctuation if missing
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, "$1 $2");

  // Fix common concatenation patterns
  cleaned = cleaned.replace(/([a-z])([A-Z][a-z])/g, "$1 $2"); // "wordWord" -> "word Word"

  // Remove excessive whitespace and normalize line breaks
  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\u00A0/g, " ") // Replace non-breaking spaces
    .trim();

  // Remove common header/footer patterns
  cleaned = cleaned
    .replace(/Page \d+ of \d+/gi, "")
    .replace(/^\d+\s*$/gm, "") // Remove standalone numbers (likely page numbers)
    .replace(/^(chapter|section|appendix)\s+\d+\s*$/gim, "$1 $2") // Normalize chapter headings
    .replace(/^\s*Table of Contents\s*$/gim, "") // Remove table of contents headers
    .replace(/^\s*References?\s*$/gim, "") // Remove reference section headers
    .replace(/^\s*Bibliography\s*$/gim, "") // Remove bibliography headers
    .replace(/^\s*Index\s*$/gim, "") // Remove index headers
    .replace(/\[?\d+\]?/g, " ") // Replace reference numbers with space
    .replace(/\b(doi|DOI):\s*[\w\-\.\/]+/gi, "") // Remove DOI references
    .replace(/\b(https?:\/\/[^\s]+)/gi, "") // Remove URLs
    .trim();

  // Remove excessive punctuation
  cleaned = cleaned
    .replace(/\.{3,}/g, "...") // Normalize ellipsis
    .replace(/\-{2,}/g, " — ") // Normalize dashes with spaces
    .replace(/\s+([,.;:!?])/g, "$1") // Remove spaces before punctuation
    .replace(/([,.;:!?])([A-Za-z])/g, "$1 $2") // Add space after punctuation
    .trim();

  // Final cleanup
  cleaned = cleaned
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, "\n\n") // Normalize paragraph breaks
    .replace(/^\s+|\s+$/gm, "") // Trim each line
    .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
    .trim();

  return cleaned;
}

/**
 * Split large text into chunks for processing
 * @param {string} text - Text to chunk
 * @param {number} maxChars - Maximum characters per chunk
 * @returns {string[]} - Array of text chunks
 */
function chunkText(text, maxChars = 20000) {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks = [];
  const paragraphs = text.split("\n\n");
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxChars) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        // Paragraph is too long, split by sentences
        const sentences = paragraph.split(/[.!?]+/);
        let sentenceChunk = "";

        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 1 <= maxChars) {
            sentenceChunk += (sentenceChunk ? ". " : "") + sentence.trim();
          } else {
            if (sentenceChunk) {
              chunks.push(sentenceChunk.trim() + ".");
              sentenceChunk = sentence.trim();
            } else {
              // Single sentence too long, force split
              chunks.push(sentence.trim().substring(0, maxChars));
            }
          }
        }

        if (sentenceChunk) {
          currentChunk = sentenceChunk.trim();
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 100); // Filter out very small chunks
}

/**
 * Extract text from a document stored in the database
 * Handles both uploaded files and pasted content
 * @param {Object} document - Document record from database
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDocument(document) {
  try {
    console.log("🔍 Debug - Document extraction started:", {
      id: document.id,
      file_path: document.file_path,
      file_type: document.file_type,
      file_name: document.file_name,
    });

    // Handle pasted content
    if (document.file_path && document.file_path.startsWith("pasted_")) {
      console.log("📝 Processing pasted content...");
      const chunks = await prisma.document_chunks.findMany({
        where: { document_id: document.id },
        orderBy: { chunk_order: "asc" },
      });
      const extractedText = chunks
        .map((chunk) => chunk.chunk_text)
        .join("\n\n");
      console.log("✅ Pasted content extracted, length:", extractedText.length);
      return extractedText;
    }

    // Handle uploaded files - download from Supabase and extract text
    console.log("📁 Processing uploaded file...");
    const bucketName =
      process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";

    // Download file from Supabase using service role key
    console.log("⬇️ Downloading from Supabase:", {
      bucketName,
      filePath: document.file_path,
    });
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(document.file_path);

    if (downloadError) {
      console.error("❌ Supabase download error:", downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log("✅ File downloaded successfully, size:", fileData.size);

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log("🔄 Converted to buffer, size:", buffer.length);

    // Extract text based on file type
    console.log("📄 Extracting text with file type:", document.file_type);
    const extractedText = await extractTextFromFile(
      buffer,
      document.file_type,
      document.file_name
    );

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text could be extracted from the file");
    }

    console.log(
      "✅ Text extracted successfully, length:",
      extractedText.length
    );
    return extractedText;
  } catch (error) {
    console.error("❌ Text extraction from document error:", error);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from a file URL (for external files or signed URLs)
 * @param {string} fileUrl - URL to the file
 * @param {string} fileName - Original filename
 * @param {string} fileType - File type
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromUrl(fileUrl, fileName = "", fileType = "") {
  try {
    console.log(`📥 Downloading file from URL: ${fileUrl}`);

    // Download file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download file from URL: ${response.statusText}`
      );
    }

    // Get file buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file type if not provided
    let detectedFileType = fileType;
    if (!detectedFileType && fileName) {
      const fileExt = fileName.toLowerCase().split(".").pop();
      if (fileExt === "pdf") detectedFileType = "pdf";
      else if (fileExt === "docx") detectedFileType = "docx";
      else if (fileExt === "txt") detectedFileType = "txt";
    }

    // Extract text
    const extractedText = await extractTextFromFile(
      buffer,
      detectedFileType || "pdf", // Default to PDF if unknown
      fileName
    );

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text could be extracted from the file");
    }

    return extractedText;
  } catch (error) {
    console.error("Text extraction from URL error:", error);
    throw new Error(`Text extraction from URL failed: ${error.message}`);
  }
}

module.exports = {
  extractTextFromFile,
  extractTextFromDocument,
  extractTextFromUrl,
  cleanText,
  chunkText,
};
