const pdf = require("pdf-parse");
const mammoth = require("mammoth");

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

  // Remove excessive whitespace and normalize line breaks
  let cleaned = text
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
    .replace(/\[?\d+\]?/g, "") // Remove reference numbers like [1], [2], etc.
    .replace(/\b(doi|DOI):\s*[\w\-\.\/]+/gi, "") // Remove DOI references
    .replace(/\b(https?:\/\/[^\s]+)/gi, "") // Remove URLs
    .trim();

  // Remove excessive punctuation
  cleaned = cleaned
    .replace(/\.{3,}/g, "...") // Normalize ellipsis
    .replace(/\-{2,}/g, "—") // Normalize dashes
    .replace(/\s+([,.;:!?])/g, "$1") // Remove spaces before punctuation
    .replace(/([,.;:!?])\s*([,.;:!?])/g, "$1 $2") // Normalize punctuation spacing
    .trim();

  // Final cleanup
  cleaned = cleaned
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

module.exports = {
  extractTextFromFile,
  cleanText,
  chunkText,
};
