/**
 * Text chunking utility for TTS processing
 * Splits text into manageable chunks while preserving sentence boundaries
 */

interface ChunkOptions {
  maxChars?: number;
  preserveSentences?: boolean;
}

/**
 * Chunks text into smaller pieces suitable for TTS processing
 * @param text - The input text to chunk
 * @param maxChars - Maximum characters per chunk (default: 1800)
 * @param preserveSentences - Whether to preserve sentence boundaries (default: true)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  maxChars: number = 1800,
  preserveSentences: boolean = true
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.trim();

  if (cleanText.length <= maxChars) {
    return [cleanText];
  }

  const chunks: string[] = [];

  if (preserveSentences) {
    // Split by paragraphs first, then by sentences
    const paragraphs = cleanText.split(/\n\s*\n/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const sentences = splitIntoSentences(paragraph);

      for (const sentence of sentences) {
        const testChunk = currentChunk
          ? `${currentChunk} ${sentence}`
          : sentence;

        if (testChunk.length <= maxChars) {
          currentChunk = testChunk;
        } else {
          // Current chunk is full, save it and start new one
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }

          // Handle very long sentences that exceed maxChars
          if (sentence.length > maxChars) {
            const subChunks = chunkLongSentence(sentence, maxChars);
            chunks.push(...subChunks);
            currentChunk = "";
          } else {
            currentChunk = sentence;
          }
        }
      }

      // Add paragraph break if we're continuing
      if (currentChunk && paragraph !== paragraphs[paragraphs.length - 1]) {
        currentChunk += "\n";
      }
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Simple character-based chunking
    for (let i = 0; i < cleanText.length; i += maxChars) {
      chunks.push(cleanText.slice(i, i + maxChars));
    }
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}

/**
 * Splits text into sentences using common punctuation
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence endings, but be careful with abbreviations
  const sentences = text.split(/[.!?]+(?=\s+[A-Z]|$)/);

  return sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s, i, arr) => {
      // Add back the punctuation unless it's the last sentence
      if (i < arr.length - 1 && !s.match(/[.!?]$/)) {
        return s + ".";
      }
      return s;
    });
}

/**
 * Handles sentences that are longer than maxChars by splitting at word boundaries
 */
function chunkLongSentence(sentence: string, maxChars: number): string[] {
  const words = sentence.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    const testChunk = currentChunk ? `${currentChunk} ${word}` : word;

    if (testChunk.length <= maxChars) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = word;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generates chapter titles from text chunks
 * @param chunks - Array of text chunks
 * @returns Array of chapter titles
 */
export function generateChapterTitles(chunks: string[]): string[] {
  return chunks.map((chunk, index) => {
    // Extract first meaningful words for chapter title
    const words = chunk.trim().split(/\s+/);
    const title = words.slice(0, 8).join(" ");

    // Clean up title
    const cleanTitle = title
      .replace(/[.!?]+$/, "") // Remove trailing punctuation
      .replace(/^[^a-zA-Z0-9]*/, "") // Remove leading non-alphanumeric
      .trim();

    return cleanTitle || `Chapter ${index + 1}`;
  });
}

/**
 * Estimates reading time for text (for duration estimates)
 * @param text - Input text
 * @param wordsPerMinute - Reading speed (default: 150 WPM)
 * @returns Estimated duration in seconds
 */
export function estimateReadingTime(
  text: string,
  wordsPerMinute: number = 150
): number {
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = wordCount / wordsPerMinute;
  return Math.ceil(minutes * 60);
}
