const axios = require("axios");

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.model = process.env.HF_MODEL || "google/flan-t5-large";
    this.maxNewTokens = parseInt(process.env.HF_MAX_NEW_TOKENS) || 512;
    this.temperature = parseFloat(process.env.HF_TEMPERATURE) || 0.3;
    this.baseUrl = "https://api-inference.huggingface.co/models";
    this.apiUrl = `${this.baseUrl}/${this.model}`;
    
    if (!this.apiKey) {
      console.warn("⚠️  Hugging Face API key not set");
    } else {
      console.log("✅ Hugging Face service initialized");
      console.log(`Model: ${this.model}`);
      console.log(`API URL: ${this.apiUrl}`);
    }
  }

  /**
   * Generate flashcards from text using FLAN-T5 model
   */
  async generateFlashcards(text, options = {}) {
    const {
      cardCount = 5,
      cardType = "basic",
      difficulty = "medium",
    } = options;

    try {
      if (!this.apiKey) {
        throw new Error("Hugging Face API key not configured");
      }

      // Create the prompt for FLAN-T5
      const prompt = this.createFlashcardPrompt(text, cardCount, cardType, difficulty);

      console.log("🤖 Calling Hugging Face API...");
      console.log(`Model: ${this.model}`);
      console.log(`Text length: ${text.length} characters`);
      console.log(`Requested cards: ${cardCount}`);

      const response = await this.callHuggingFaceAPI(prompt);
      
      if (!response) {
        throw new Error("Empty response from Hugging Face API");
      }

      console.log("✅ Hugging Face API response received");
      console.log("Response length:", response.length);

      // Parse and validate the response
      const flashcards = await this.parseFlashcardResponse(response, cardCount);

      return flashcards;
    } catch (error) {
      console.error("Hugging Face generation error:", error);
      throw new Error(`Flashcard generation failed: ${error.message}`);
    }
  }

  /**
   * Create a prompt for FLAN-T5 flashcard generation
   */
  createFlashcardPrompt(text, cardCount, cardType, difficulty) {
    const basePrompt = `Convert the following passage into ${cardCount} flashcards. 
Each flashcard should be in JSON format with "question" and "answer" fields.
Difficulty level: ${difficulty}
Card type: ${cardType}

Return only a JSON array of flashcards in this exact format:
[
  {
    "question": "Question text here?",
    "answer": "Answer text here"
  }
]

Passage:
${text}

JSON flashcards:`;

    return basePrompt;
  }

  /**
   * Call Hugging Face Inference API with retry logic
   */
  async callHuggingFaceAPI(prompt, maxRetries = 3) {
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };

    const payload = {
      inputs: prompt,
      parameters: {
        max_new_tokens: this.maxNewTokens,
        temperature: this.temperature,
        return_full_text: false,
        do_sample: true,
      },
      options: {
        wait_for_model: true
      }
    };

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} - Calling Hugging Face API`);
        console.log(`URL: ${this.apiUrl}`);

        const response = await axios.post(this.apiUrl, payload, {
          headers,
          timeout: 60000, // 60 seconds timeout for model loading
        });

        console.log("Raw API response:", JSON.stringify(response.data, null, 2));

        // Handle different response formats
        if (response.data) {
          // Case 1: Direct string response
          if (typeof response.data === 'string') {
            return response.data.trim();
          }
          
          // Case 2: Array with generated_text
          if (Array.isArray(response.data) && response.data.length > 0) {
            const firstResult = response.data[0];
            if (firstResult.generated_text) {
              return firstResult.generated_text.trim();
            }
            if (typeof firstResult === 'string') {
              return firstResult.trim();
            }
          }

          // Case 3: Object with generated_text
          if (response.data.generated_text) {
            return response.data.generated_text.trim();
          }
        }

        throw new Error("Invalid response format from Hugging Face API");

      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);

        // Handle specific error types
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;

          console.log("Error response data:", JSON.stringify(errorData, null, 2));

          if (status === 503) {
            console.log("Model is loading, waiting before retry...");
            await this.delay(Math.pow(2, attempt) * 5000); // Longer wait for model loading
            continue;
          }

          if (status === 401) {
            throw new Error("Invalid Hugging Face API key");
          }

          if (status === 429) {
            console.log("Rate limit hit, waiting before retry...");
            await this.delay(Math.pow(2, attempt) * 3000);
            continue;
          }

          if (status === 404) {
            throw new Error(`Model not found: ${this.model}. Please check the model name.`);
          }

          if (status >= 500) {
            console.log("Server error, retrying...");
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }

          throw new Error(`API error ${status}: ${errorData?.error || JSON.stringify(errorData) || error.message}`);
        }

        // Network errors
        if (error.code === 'ECONNABORTED') {
          throw new Error("Request timeout - model response took too long");
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          console.log(`Waiting ${1000 * attempt}ms before retry...`);
          await this.delay(1000 * attempt);
        }
      }
    }

    throw new Error(`Hugging Face API failed after ${maxRetries} attempts. Last error: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Parse and validate flashcard response from FLAN-T5
   */
  async parseFlashcardResponse(response, expectedCount) {
    try {
      console.log("🔍 Parsing Hugging Face response...");
      console.log("Raw response:", response.substring(0, 500) + "...");

      // Try to extract JSON from the response
      let jsonStr = this.extractJSON(response);
      
      if (!jsonStr) {
        throw new Error("No JSON found in response");
      }

      // Parse JSON
      let flashcards;
      try {
        flashcards = JSON.parse(jsonStr);
      } catch (parseError) {
        console.log("JSON parse failed, trying to repair...");
        // Try to repair common JSON issues
        jsonStr = this.repairJSON(jsonStr);
        flashcards = JSON.parse(jsonStr);
      }

      // Validate structure
      if (!Array.isArray(flashcards)) {
        throw new Error("Response is not an array of flashcards");
      }

      // Validate and clean each flashcard
      const validFlashcards = flashcards
        .filter(card => this.isValidFlashcard(card))
        .map(card => this.cleanFlashcard(card))
        .slice(0, expectedCount); // Limit to expected count

      if (validFlashcards.length === 0) {
        throw new Error("No valid flashcards found in response");
      }

      console.log(`✅ Parsed ${validFlashcards.length} valid flashcards`);
      return validFlashcards;

    } catch (error) {
      console.error("Parse error:", error);
      
      // Fallback: try to extract question-answer pairs manually
      console.log("🔄 Attempting fallback parsing...");
      const fallbackCards = this.extractFallbackFlashcards(response, expectedCount);
      
      if (fallbackCards.length > 0) {
        console.log(`✅ Fallback parsing successful: ${fallbackCards.length} cards`);
        return fallbackCards;
      }

      throw new Error(`Failed to parse flashcards: ${error.message}`);
    }
  }

  /**
   * Extract JSON from response text
   */
  extractJSON(text) {
    // Look for JSON array patterns
    const jsonPatterns = [
      /\[[\s\S]*\]/,  // JSON array
      /\{[\s\S]*\}/,  // JSON object
    ];

    for (const pattern of jsonPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Basic JSON repair for common issues
   */
  repairJSON(jsonStr) {
    let repaired = jsonStr;
    
    // Fix common issues
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    repaired = repaired.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
    
    return repaired;
  }

  /**
   * Validate if object is a valid flashcard
   */
  isValidFlashcard(card) {
    return (
      card &&
      typeof card === 'object' &&
      card.question &&
      typeof card.question === 'string' &&
      card.question.trim().length > 0 &&
      card.answer &&
      typeof card.answer === 'string' &&
      card.answer.trim().length > 0
    );
  }

  /**
   * Clean and format flashcard
   */
  cleanFlashcard(card) {
    return {
      question: card.question.trim(),
      answer: card.answer.trim(),
      difficulty_level: 3, // Default difficulty
      source_text: card.source_text || null,
      explanation: card.explanation || null
    };
  }

  /**
   * Fallback parsing when JSON parsing fails
   */
  extractFallbackFlashcards(text, maxCards) {
    const cards = [];
    
    // Try to find question-answer patterns
    const patterns = [
      /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs,
      /Question:\s*(.+?)\s*Answer:\s*(.+?)(?=Question:|$)/gs,
      /"question":\s*"([^"]+)"\s*,?\s*"answer":\s*"([^"]+)"/gs,
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches.slice(0, maxCards)) {
        const question = match[1]?.trim();
        const answer = match[2]?.trim();
        
        if (question && answer && question.length > 0 && answer.length > 0) {
          cards.push({
            question,
            answer,
            difficulty_level: 3,
            source_text: null,
            explanation: null
          });
        }
      }

      if (cards.length > 0) break;
    }

    return cards.slice(0, maxCards);
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      const testPrompt = "What is the capital of France?";
      const response = await this.callHuggingFaceAPI(testPrompt, 1);
      console.log("✅ Hugging Face API connection test successful");
      return { success: true, response: response.substring(0, 100) };
    } catch (error) {
      console.error("❌ Hugging Face API connection test failed:", error.message);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const huggingfaceService = new HuggingFaceService();

module.exports = huggingfaceService;
