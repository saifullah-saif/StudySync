// Use built-in fetch (Node.js 18+) or fallback to node-fetch
const fetch = globalThis.fetch || require("node-fetch");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_GENERATION_TOKENS =
  parseInt(process.env.MAX_GENERATION_TOKENS) || 1000;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required in environment variables");
}

/**
 * Build the prompt for OpenAI flashcard generation
 * @param {string} text - Input text to generate flashcards from
 * @returns {string} - Formatted prompt
 */
function buildFlashcardPrompt(text) {
  return `From the input text produce a JSON array only (no commentary):

Each array element must be an object:
{
  "question": "short question (<=25 words)",
  "answer": "concise answer (1-3 sentences)",
  "type": "basic" | "mcq",               // optional, default "basic"
  "options": ["A", "B", "C", "D"],      // include ONLY for type == "mcq" and must be exactly 4
  "correct_index": 0,                   // include ONLY for type == "mcq" (0-based)
  "difficulty": 1                       // optional: 1=easy,2=medium,3=hard
}

Rules:
1. Generate between 6 and 12 items prioritized by importance.
2. Questions must be concise, not full paragraphs.
3. MCQs must have exactly 4 options and correct_index must identify the correct option.
4. Output must be valid JSON array only—no extra text, no backticks.
5. If input is long, generate the best set of cards for the given input.

Input:
-----BEGIN INPUT-----
${text}
-----END INPUT-----`;
}

/**
 * Call OpenAI API to generate flashcards
 * @param {string} text - Input text
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Array>} - Array of flashcard objects
 */
async function generateFlashcards(text, retries = 2) {
  try {
    const prompt = buildFlashcardPrompt(text);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a strict JSON flashcard generator. Output only valid JSON array, nothing else.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: MAX_GENERATION_TOKENS,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ""
        }`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return parseFlashcardResponse(content);
  } catch (error) {
    console.error("OpenAI API error:", error.message);

    if (
      retries > 0 &&
      (error.message.includes("rate limit") ||
        error.message.includes("timeout"))
    ) {
      // Exponential backoff for rate limits
      const delay = (3 - retries) * 500 + 500; // 500ms, 1000ms, 1500ms
      console.log(
        `Retrying OpenAI request in ${delay}ms... (${retries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return generateFlashcards(text, retries - 1);
    }

    throw error;
  }
}

/**
 * Parse OpenAI response and extract flashcards
 * @param {string} content - Raw response content
 * @returns {Array} - Array of flashcard objects
 */
function parseFlashcardResponse(content) {
  try {
    // First try direct JSON parsing
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return validateAndCleanFlashcards(parsed);
    }
    throw new Error("Response is not an array");
  } catch (error) {
    // Try to extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return validateAndCleanFlashcards(parsed);
        }
      } catch (innerError) {
        // Fall through to error
      }
    }

    throw new Error(
      `Failed to parse flashcard response: ${
        error.message
      }. Raw content: ${content.substring(0, 500)}`
    );
  }
}

/**
 * Validate and clean flashcard objects
 * @param {Array} flashcards - Raw flashcard array
 * @returns {Array} - Validated flashcard array
 */
function validateAndCleanFlashcards(flashcards) {
  const validated = [];

  for (const card of flashcards) {
    if (!card.question || !card.answer) {
      continue; // Skip invalid cards
    }

    const cleanCard = {
      question: String(card.question).substring(0, 500), // Limit question length
      answer: String(card.answer).substring(0, 1000), // Limit answer length
      type: card.type === "mcq" ? "mcq" : "basic",
      difficulty: Math.max(1, Math.min(3, parseInt(card.difficulty) || 2)), // Clamp between 1-3
    };

    // Validate MCQ cards
    if (cleanCard.type === "mcq") {
      if (Array.isArray(card.options) && card.options.length === 4) {
        cleanCard.options = card.options.map((opt) =>
          String(opt).substring(0, 200)
        );
        cleanCard.correct_index = Math.max(
          0,
          Math.min(3, parseInt(card.correct_index) || 0)
        );
      } else {
        cleanCard.type = "basic"; // Fallback to basic if MCQ format is invalid
      }
    }

    validated.push(cleanCard);
  }

  return validated;
}

/**
 * Deduplicate flashcards by normalized question
 * @param {Array} flashcards - Array of flashcard objects
 * @returns {Array} - Deduplicated flashcards
 */
function deduplicateFlashcards(flashcards) {
  const seen = new Set();
  const deduplicated = [];

  for (const card of flashcards) {
    const normalizedQuestion = card.question
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
    if (!seen.has(normalizedQuestion)) {
      seen.add(normalizedQuestion);
      deduplicated.push(card);
    }
  }

  return deduplicated;
}

module.exports = {
  generateFlashcards,
  parseFlashcardResponse,
  deduplicateFlashcards,
  buildFlashcardPrompt,
};
