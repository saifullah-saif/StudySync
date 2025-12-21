/**
 * Hugging Face AI Client for Flashcard Generation
 * Uses Inference API with various free models
 */

const fetch = globalThis.fetch || require("node-fetch");

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = "https://api-inference.huggingface.co/models/";

// Best free models for text generation on Hugging Face
const MODELS = {
  mistral: "mistralai/Mistral-7B-Instruct-v0.2",
  llama: "meta-llama/Llama-2-7b-chat-hf",
  falcon: "tiiuae/falcon-7b-instruct",
  phi: "microsoft/phi-2",
};

if (!HF_API_KEY) {
  console.log("⚠️ Hugging Face API key not configured. Get one free at: https://huggingface.co/settings/tokens");
}

/**
 * Generate flashcards using Hugging Face
 * @param {string} text - Input text to generate flashcards from
 * @param {number} maxCards - Maximum number of flashcards to generate
 * @param {number} targetDifficulty - Difficulty level (1-5)
 * @returns {Promise<Array>} - Array of flashcard objects
 */
async function generateFlashcardsWithHuggingFace(text, maxCards = 10, targetDifficulty = 3) {
  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key not configured. Set HUGGINGFACE_API_KEY in .env file");
  }

  const difficultyMap = {
    1: "very easy",
    2: "easy",
    3: "medium",
    4: "hard",
    5: "very hard",
  };
  const difficultyLevel = difficultyMap[targetDifficulty] || "medium";

  console.log(`🤗 Hugging Face: Generating ${maxCards} ${difficultyLevel} flashcards...`);

  const prompt = `[INST] You are an expert educator. Create exactly ${maxCards} ${difficultyLevel} difficulty flashcards from this text.

Return ONLY valid JSON in this exact format:
{
  "flashcards": [
    {
      "question": "Clear question here",
      "answer": "Detailed answer here",
      "difficulty": ${targetDifficulty}
    }
  ]
}

Text: ${text.substring(0, 2000)}

Generate ${maxCards} flashcards. Return only JSON. [/INST]`;

  try {
    const response = await fetch(HF_API_URL + MODELS.mistral, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Hugging Face API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    let content = "";

    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text;
    } else if (data.generated_text) {
      content = data.generated_text;
    } else {
      throw new Error("Unexpected response format from Hugging Face");
    }

    console.log("Hugging Face response received, parsing...");

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Hugging Face response:", content);
      throw new Error("No JSON found in Hugging Face response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid flashcard format from Hugging Face");
    }

    // Validate and clean flashcards
    const cleanedCards = parsed.flashcards
      .filter(card => card.question && card.answer)
      .map(card => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
        type: "basic",
        difficulty: card.difficulty || targetDifficulty,
      }));

    console.log(`✅ Hugging Face generated ${cleanedCards.length} flashcards`);
    return cleanedCards;
  } catch (error) {
    console.error("❌ Hugging Face generation error:", error.message);
    throw new Error(`Failed to generate flashcards with Hugging Face: ${error.message}`);
  }
}

/**
 * Generate Q&A pairs using Hugging Face
 * @param {string} text - Input text to generate Q&A pairs from
 * @param {number} maxPairs - Maximum number of Q&A pairs to generate
 * @returns {Promise<Array>} - Array of Q&A objects
 */
async function generateQAPairsWithHuggingFace(text, maxPairs = 8) {
  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key not configured. Set HUGGINGFACE_API_KEY in .env file");
  }

  console.log(`🤗 Hugging Face: Generating ${maxPairs} Q&A pairs...`);

  const prompt = `[INST] You are an expert educator. Create exactly ${maxPairs} question-answer pairs from this text.

Return ONLY valid JSON in this exact format:
{
  "qaPairs": [
    {
      "question": "Clear question here",
      "answer": "Concise answer here",
      "type": "definition|fact|process|explanation"
    }
  ]
}

Text: ${text.substring(0, 2000)}

Generate ${maxPairs} Q&A pairs. Return only JSON. [/INST]`;

  try {
    const response = await fetch(HF_API_URL + MODELS.mistral, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Hugging Face API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    let content = "";

    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text;
    } else if (data.generated_text) {
      content = data.generated_text;
    } else {
      throw new Error("Unexpected response format from Hugging Face");
    }

    console.log("Hugging Face Q&A response received, parsing...");

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Hugging Face response:", content);
      throw new Error("No JSON found in Hugging Face response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.qaPairs || !Array.isArray(parsed.qaPairs)) {
      throw new Error("Invalid Q&A format from Hugging Face");
    }

    // Validate and clean Q&A pairs
    const cleanedPairs = parsed.qaPairs
      .filter(pair => pair.question && pair.answer)
      .map(pair => ({
        question: pair.question.trim(),
        answer: pair.answer.trim(),
        type: pair.type || "general",
      }));

    console.log(`✅ Hugging Face generated ${cleanedPairs.length} Q&A pairs`);
    return cleanedPairs;
  } catch (error) {
    console.error("❌ Hugging Face Q&A generation error:", error.message);
    throw new Error(`Failed to generate Q&A pairs with Hugging Face: ${error.message}`);
  }
}

module.exports = {
  generateFlashcardsWithHuggingFace,
  generateQAPairsWithHuggingFace,
};
