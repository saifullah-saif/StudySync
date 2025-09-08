const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// OpenAI setup
let hasOpenAI = false;
let openai = null;

try {
  const { OpenAI } = require("openai");
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    hasOpenAI = true;
    console.log("✅ OpenAI service initialized for summarization");
  } else {
    console.log(
      "⚠️ OpenAI API key not found - falling back to HuggingFace for summarization"
    );
  }
} catch (error) {
  console.log(
    "⚠️ OpenAI package not available - falling back to HuggingFace for summarization"
  );
}

// HuggingFace setup
const axios = require("axios");

class SummaryService {
  constructor() {
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.huggingfaceModel = process.env.HF_MODEL || "microsoft/DialoGPT-medium";
    this.maxTokens = parseInt(process.env.HF_MAX_NEW_TOKENS) || 512;
    this.temperature = parseFloat(process.env.HF_TEMPERATURE) || 0.3;
  }

  /**
   * Generate summary using OpenAI or Hugging Face fallback
   */
  async generateSummary(content, options = {}) {
    const {
      summaryType = "concise", // concise, detailed, bullets, outline
      customInstructions = "",
      maxLength = 500,
      sourceType = "note", // note, pdf, document
    } = options;

    try {
      // Try OpenAI first
      if (hasOpenAI && openai) {
        return await this.generateWithOpenAI(content, {
          summaryType,
          customInstructions,
          maxLength,
          sourceType,
        });
      }
    } catch (error) {
      console.warn(
        "OpenAI failed, falling back to Hugging Face:",
        error.message
      );
    }

    // Fallback to Hugging Face
    return await this.generateWithHuggingFace(content, options);
  }

  async generateWithOpenAI(content, options) {
    const prompt = this.buildPrompt(content, options);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(options.summaryType),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: Math.min(options.maxLength * 2, 1000),
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      summary: result.summary,
      keyPoints: result.key_points || [],
      wordCount: result.summary.split(" ").length,
      provider: "openai",
    };
  }

  async generateWithHuggingFace(content, options) {
    if (!this.huggingfaceApiKey) {
      throw new Error(
        "HuggingFace API key not configured and OpenAI unavailable"
      );
    }

    // Truncate content for HF model limits
    const truncatedContent = content.substring(0, 1000);

    const prompt = `Summarize the following text in ${
      options.maxLength || 500
    } words or less:\n\n${truncatedContent}`;

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.huggingfaceModel}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: Math.min(options.maxLength || 500, this.maxTokens),
            temperature: this.temperature,
            return_full_text: false,
            do_sample: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.huggingfaceApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      let summary = "";
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        summary =
          response.data[0].generated_text ||
          truncatedContent.substring(0, options.maxLength || 500);
      } else {
        // Fallback to simple extraction
        summary = this.generateSimpleSummary(
          truncatedContent,
          options.maxLength || 500
        );
      }

      return {
        summary: summary.trim(),
        keyPoints: this.extractKeyPoints(summary),
        wordCount: summary.trim().split(" ").length,
        provider: "huggingface",
      };
    } catch (error) {
      console.error("HuggingFace API error:", error.message);
      // Final fallback to simple text extraction
      const summary = this.generateSimpleSummary(
        content,
        options.maxLength || 500
      );
      return {
        summary,
        keyPoints: this.extractKeyPoints(summary),
        wordCount: summary.split(" ").length,
        provider: "fallback",
      };
    }
  }

  /**
   * Generate simple extractive summary as final fallback
   */
  generateSimpleSummary(content, maxLength) {
    // Split into sentences
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);

    if (sentences.length === 0) {
      return content.substring(0, maxLength);
    }

    // Take first few sentences up to maxLength
    let summary = "";
    let wordCount = 0;

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(" ").length;
      if (wordCount + sentenceWords > maxLength) break;

      summary += sentence.trim() + ". ";
      wordCount += sentenceWords;
    }

    return summary.trim() || content.substring(0, maxLength);
  }

  /**
   * Extract key points from summary text
   */
  extractKeyPoints(summary) {
    // Simple extraction of sentences as key points
    const sentences = summary
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);
    return sentences.slice(0, 5).map((s) => s.trim());
  }

  buildPrompt(content, options) {
    const basePrompt = `Please summarize the following ${options.sourceType} content`;

    let instructions = "";
    if (options.summaryType === "bullets") {
      instructions = "in bullet point format";
    } else if (options.summaryType === "detailed") {
      instructions = "with detailed explanations";
    } else if (options.summaryType === "outline") {
      instructions = "in outline format with main topics and subtopics";
    } else {
      instructions = "concisely";
    }

    const customNote = options.customInstructions
      ? `\n\nAdditional instructions: ${options.customInstructions}`
      : "";

    return `${basePrompt} ${instructions}. Aim for approximately ${options.maxLength} words.${customNote}\n\nContent:\n${content}`;
  }

  getSystemPrompt(summaryType) {
    const prompts = {
      concise:
        "You are an expert summarizer. Create concise, accurate summaries that capture the essential information. Return JSON with 'summary' and 'key_points' fields.",
      detailed:
        "You are an expert summarizer. Create detailed summaries that explain concepts thoroughly while remaining clear. Return JSON with 'summary' and 'key_points' fields.",
      bullets:
        "You are an expert summarizer. Create bullet-point summaries that highlight key information clearly. Return JSON with 'summary' and 'key_points' fields.",
      outline:
        "You are an expert summarizer. Create structured outlines with main topics and subtopics. Return JSON with 'summary' and 'key_points' fields.",
    };

    return prompts[summaryType] || prompts.concise;
  }

  /**
   * Cache summary result
   */
  async cacheSummary(contentHash, summary, userId) {
    try {
      // Check if ai_summaries table exists, if not use simple cache approach
      return await prisma.ai_summaries.create({
        data: {
          note_id: null, // Can be set if summarizing a specific note
          summary_text: JSON.stringify(summary),
          ai_model_version: summary.provider,
          confidence_score: 0.8,
          generated_at: new Date(),
          is_approved_by_user: false,
        },
      });
    } catch (error) {
      console.warn("Could not cache summary in database:", error.message);
      // Could implement in-memory caching here if needed
      return null;
    }
  }

  /**
   * Get cached summary (simplified version)
   */
  async getCachedSummary(contentHash, userId) {
    try {
      // For now, skip caching to ensure fresh summaries
      // Could implement more sophisticated caching later
      return null;
    } catch (error) {
      console.warn("Could not retrieve cached summary:", error.message);
      return null;
    }
  }
}

module.exports = new SummaryService();
