/**
 * Text chunking utility for TTS processing
 * Handles intelligent text splitting with sentence boundary preservation
 */

export interface TextChunk {
  index: number;
  text: string;
  chapterTitle: string;
  estimatedDuration: number; // in seconds
}

export interface ChunkOptions {
  maxChars?: number;
  preserveSentences?: boolean;
  generateChapterTitles?: boolean;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChars: 1800,
  preserveSentences: true,
  generateChapterTitles: true,
};

/**
 * Chunk text into TTS-friendly segments
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean and normalize text
  const cleanText = normalizeText(text);

  // Split into paragraphs first
  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // If paragraph is too long, split by sentences
    if (paragraph.length > opts.maxChars) {
      // Process any existing chunk first
      if (currentChunk.trim()) {
        chunks.push(createChunk(currentChunk.trim(), chunkIndex, opts));
        chunkIndex++;
        currentChunk = "";
      }

      // Split long paragraph into sentences
      const sentences = splitIntoSentences(paragraph);

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 > opts.maxChars) {
          if (currentChunk.trim()) {
            chunks.push(createChunk(currentChunk.trim(), chunkIndex, opts));
            chunkIndex++;
          }
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
        }
      }
    } else {
      // Check if adding this paragraph exceeds limit
      if (currentChunk.length + paragraph.length + 2 > opts.maxChars) {
        if (currentChunk.trim()) {
          chunks.push(createChunk(currentChunk.trim(), chunkIndex, opts));
          chunkIndex++;
        }
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk.trim(), chunkIndex, opts));
  }

  return chunks;
}

/**
 * Create a text chunk with metadata
 */
function createChunk(
  text: string,
  index: number,
  options: Required<ChunkOptions>
): TextChunk {
  return {
    index,
    text,
    chapterTitle: options.generateChapterTitles
      ? generateChapterTitle(text, index)
      : `Chapter ${index + 1}`,
    estimatedDuration: estimateReadingTime(text),
  };
}

/**
 * Normalize text for TTS processing
 */
function normalizeText(text: string): string {
  return (
    text
      // Fix common Unicode issues
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      // Fix punctuation spacing
      .replace(/\s+([.!?])/g, "$1")
      .replace(/([.!?])\s*\n/g, "$1\n")
      .trim()
  );
}

/**
 * Split text into sentences while preserving structure
 */
function splitIntoSentences(text: string): string[] {
  // Enhanced sentence splitting that handles abbreviations and edge cases
  const sentences: string[] = [];

  // Split by sentence-ending punctuation with lookahead
  const parts = text.split(/([.!?]+\s+)/);

  let currentSentence = "";

  for (let i = 0; i < parts.length; i++) {
    currentSentence += parts[i];

    // If this part ends with sentence punctuation and is followed by whitespace
    if (i % 2 === 1 && i < parts.length - 1) {
      const sentence = currentSentence.trim();
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      currentSentence = "";
    }
  }

  // Add any remaining text
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  return sentences.filter((s) => s.length > 0);
}

/**
 * Generate chapter titles from text content
 */
function generateChapterTitle(text: string, index: number): string {
  // Extract first sentence or meaningful phrase
  const firstSentence = text.split(/[.!?]/)[0].trim();

  if (!firstSentence) {
    return `Chapter ${index + 1}`;
  }

  // Look for topic indicators
  const topicMatch = firstSentence.match(
    /^(?:in|on|about|regarding|concerning)\s+(.+)/i
  );
  if (topicMatch) {
    return capitalizeTitle(topicMatch[1]);
  }

  // Extract key phrases (first few words)
  const words = firstSentence.split(/\s+/).slice(0, 6);
  const title = words.join(" ");

  if (title.length > 50) {
    return title.slice(0, 47) + "...";
  }

  return capitalizeTitle(title) || `Chapter ${index + 1}`;
}

/**
 * Capitalize title properly
 */
function capitalizeTitle(title: string): string {
  if (!title) return "";

  return title
    .split(/\s+/)
    .map((word, index) => {
      // Always capitalize first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // Don't capitalize articles, prepositions, conjunctions (unless they're first/last)
      const lowercaseWords = [
        "a",
        "an",
        "and",
        "as",
        "at",
        "but",
        "by",
        "for",
        "in",
        "nor",
        "of",
        "on",
        "or",
        "so",
        "the",
        "to",
        "up",
        "yet",
      ];

      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Estimate reading time in seconds (for TTS duration estimation)
 */
export function estimateReadingTime(text: string): number {
  if (!text) return 0;

  // Average TTS speed: ~150-180 words per minute
  // Use 160 WPM as baseline
  const wordsPerMinute = 160;
  const wordCount = text.trim().split(/\s+/).length;

  return Math.ceil((wordCount / wordsPerMinute) * 60);
}

/**
 * Validate text for TTS processing
 */
export function validateTextForTTS(text: string): {
  valid: boolean;
  error?: string;
} {
  if (!text || typeof text !== "string") {
    return { valid: false, error: "Text must be a non-empty string" };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Text cannot be empty" };
  }

  if (trimmed.length > 500000) {
    return { valid: false, error: "Text too long (max 500,000 characters)" };
  }

  // Check for excessive repetition that might confuse TTS
  const words = trimmed.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 100 && uniqueWords.size / words.length < 0.1) {
    return { valid: false, error: "Text appears to have excessive repetition" };
  }

  return { valid: true };
}
