/**
 * Podcast Text Preparation and Validation Service
 * Enforces hard limits on text before TTS generation
 *
 * LIMITS (Non-Negotiable):
 * - Max characters: 8,000
 * - Max words: 1,500
 * - Max estimated duration: 10-12 minutes
 */

const Anthropic = require("@anthropic-ai/sdk");

// Hard limits
const LIMITS = {
  MAX_CHARS: 8000,
  MAX_WORDS: 1500,
  MAX_DURATION_MINUTES: 12,
  AVERAGE_WORDS_PER_MINUTE: 150, // Standard reading pace
};

class PodcastTextService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Validate and prepare text for TTS
   * Automatically reduces text if it exceeds limits
   */
  async prepareTextForTTS(rawText, title = "Content") {
    console.log("📝 Preparing text for TTS...");

    // Count characters and words
    const charCount = rawText.length;
    const wordCount = this.countWords(rawText);
    const estimatedMinutes = wordCount / LIMITS.AVERAGE_WORDS_PER_MINUTE;

    console.log(`  Characters: ${charCount} (max: ${LIMITS.MAX_CHARS})`);
    console.log(`  Words: ${wordCount} (max: ${LIMITS.MAX_WORDS})`);
    console.log(
      `  Estimated duration: ${estimatedMinutes.toFixed(1)} minutes (max: ${
        LIMITS.MAX_DURATION_MINUTES
      })`
    );

    // Check if text exceeds limits
    const exceedsLimits =
      charCount > LIMITS.MAX_CHARS ||
      wordCount > LIMITS.MAX_WORDS ||
      estimatedMinutes > LIMITS.MAX_DURATION_MINUTES;

    let finalText = rawText;
    let wasReduced = false;

    if (exceedsLimits) {
      console.log(
        "⚠️  Text exceeds limits - automatically generating concise version..."
      );
      finalText = await this.reduceToConciseVersion(rawText, title);
      wasReduced = true;
    }

    // Final counts
    const finalCharCount = finalText.length;
    const finalWordCount = this.countWords(finalText);
    const finalEstimatedMinutes =
      finalWordCount / LIMITS.AVERAGE_WORDS_PER_MINUTE;

    console.log("✅ Text preparation complete:");
    console.log(`  Final characters: ${finalCharCount}`);
    console.log(`  Final words: ${finalWordCount}`);
    console.log(
      `  Final estimated duration: ${finalEstimatedMinutes.toFixed(1)} minutes`
    );

    return {
      text: finalText,
      charCount: finalCharCount,
      wordCount: finalWordCount,
      estimatedDurationMinutes: finalEstimatedMinutes,
      wasReduced,
      original: {
        charCount,
        wordCount,
        estimatedMinutes,
      },
    };
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Generate a concise version of the text using Claude
   * Target: ~1200 words (allows buffer under 1500 limit)
   */
  async reduceToConciseVersion(text, title) {
    console.log("🤖 Calling Claude to create concise podcast script...");

    const targetWords = 1200; // Safe buffer under 1500 limit

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are creating a concise podcast script from the following content.

STRICT REQUIREMENTS:
- Maximum ${targetWords} words
- Must be suitable for text-to-speech (conversational, natural)
- Focus on key concepts, main ideas, and most important information
- Remove filler, redundancy, and non-essential details
- Use clear, simple language
- Maintain logical flow

CONTENT TITLE: ${title}

ORIGINAL CONTENT:
${text}

Create a concise, engaging podcast script that captures the essence of this content in approximately ${targetWords} words. Make it sound natural when spoken aloud.`,
          },
        ],
      });

      const conciseText = response.content[0].text;
      console.log(`✅ Generated concise version (${this.countWords(conciseText)} words)`);

      return conciseText;
    } catch (error) {
      console.error("❌ Failed to generate concise version:", error.message);

      // Fallback: Simple truncation with word boundary
      console.log("⚠️  Falling back to simple truncation...");
      return this.truncateToWordLimit(text, targetWords);
    }
  }

  /**
   * Fallback: Truncate text to word limit at word boundary
   */
  truncateToWordLimit(text, maxWords) {
    const words = text.trim().split(/\s+/);

    if (words.length <= maxWords) {
      return text;
    }

    const truncated = words.slice(0, maxWords).join(" ");
    return truncated + "...";
  }

  /**
   * Validate text meets minimum requirements
   */
  validateMinimumRequirements(text) {
    const errors = [];

    if (!text || typeof text !== "string") {
      errors.push("Text must be a non-empty string");
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      errors.push("Text cannot be empty");
    }

    const wordCount = this.countWords(trimmed);
    if (wordCount < 10) {
      errors.push("Text must contain at least 10 words");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new PodcastTextService();
