const axios = require("axios");

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.model = process.env.HF_MODEL || "gpt2";
    this.maxNewTokens = parseInt(process.env.HF_MAX_NEW_TOKENS) || 512;
    this.temperature = parseFloat(process.env.HF_TEMPERATURE) || 0.3;
    this.baseURL = "https://api-inference.huggingface.co/models";

    if (!this.apiKey) {
      console.warn("⚠️ HUGGINGFACE_API_KEY not found in environment variables");
    } else {
      console.log("✅ HuggingFace Service initialized");
    }
  }

  /**
   * Check if HuggingFace service is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Generate text using HuggingFace API
   */
  async generateText(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key not configured");
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || this.maxNewTokens,
            temperature: options.temperature || this.temperature,
            do_sample: true,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data[0].generated_text || "";
      }

      return "";
    } catch (error) {
      console.error("HuggingFace API error:", error.message);
      throw new Error(`HuggingFace generation failed: ${error.message}`);
    }
  }

  /**
   * Generate flashcards using HuggingFace (fallback method)
   */
  async generateFlashcards(text, options = {}) {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key not configured");
    }

    const { maxCards = 5, cardType = "basic", difficulty = 3 } = options;

    try {
      const prompt = this.createFlashcardPrompt(
        text,
        maxCards,
        cardType,
        difficulty
      );
      const generatedText = await this.generateText(prompt, {
        maxTokens: 1000,
        temperature: 0.7,
      });

      // Parse the generated text into flashcards
      const flashcards = this.parseFlashcards(generatedText, cardType);

      return flashcards.slice(0, maxCards);
    } catch (error) {
      console.error("Flashcard generation error:", error);
      throw error;
    }
  }

  /**
   * Create a prompt for flashcard generation
   */
  createFlashcardPrompt(text, maxCards, cardType, difficulty) {
    const difficultyMap = {
      1: "very easy",
      2: "easy",
      3: "medium",
      4: "hard",
      5: "very hard",
    };

    const difficultyLevel = difficultyMap[difficulty] || "medium";

    return `Create ${maxCards} ${difficultyLevel} flashcards from this text:

${text}

Format each flashcard as:
Q: [Question]
A: [Answer]
---

Generate exactly ${maxCards} flashcards:

`;
  }

  /**
   * Parse generated text into flashcard objects
   */
  parseFlashcards(generatedText, cardType) {
    const flashcards = [];
    const cards = generatedText.split("---").filter((card) => card.trim());

    for (const card of cards) {
      const lines = card
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      let question = "";
      let answer = "";

      for (const line of lines) {
        if (line.startsWith("Q:")) {
          question = line.substring(2).trim();
        } else if (line.startsWith("A:")) {
          answer = line.substring(2).trim();
        }
      }

      if (question && answer) {
        flashcards.push({
          question,
          answer,
          explanation: null,
          difficulty_level: 3,
          source_text: card.trim(),
        });
      }
    }

    return flashcards;
  }

  /**
   * Test the HuggingFace connection
   */
  async testConnection() {
    if (!this.apiKey) {
      return { success: false, message: "API key not configured" };
    }

    try {
      const testPrompt = "Hello, this is a test.";
      const result = await this.generateText(testPrompt, { maxTokens: 10 });

      return {
        success: true,
        message: "HuggingFace connection successful",
        model: this.model,
        result: result.substring(0, 50) + "...",
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}

module.exports = new HuggingFaceService();
