/**
 * Groq AI Client for Flashcard Generation
 * FREE TIER: 14,400 requests/day, 30 requests/minute
 * Very fast inference with Llama 3.1 models
 */

const fetch = globalThis.fetch || require("node-fetch");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!GROQ_API_KEY) {
  console.log("⚠️ Groq API key not configured. Get one free at: https://console.groq.com");
}

/**
 * Generate flashcards using Groq (Llama 3.1 70B)
 * @param {string} text - Input text to generate flashcards from
 * @param {number} maxCards - Maximum number of flashcards to generate
 * @param {number} targetDifficulty - Difficulty level (1-5)
 * @returns {Promise<Array>} - Array of flashcard objects
 */
async function generateFlashcardsWithGroq(text, maxCards = 10, targetDifficulty = 3) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured. Set GROQ_API_KEY in .env file");
  }

  const difficultyMap = {
    1: "very easy",
    2: "easy",
    3: "medium",
    4: "hard",
    5: "very hard",
  };
  const difficultyLevel = difficultyMap[targetDifficulty] || "medium";

  console.log(`🚀 Groq: Generating ${maxCards} ${difficultyLevel} flashcards...`);

  const prompt = `You are an expert educator creating ${difficultyLevel} difficulty flashcards from educational content.

INSTRUCTIONS:
- Analyze the text deeply to extract the most educationally valuable information
- Create exactly ${maxCards} flashcards
- Each flashcard should promote active recall and spaced repetition learning
- Questions should be ${difficultyLevel} difficulty level
- Use diverse question types to engage different cognitive processes
- Answers should be clear, accurate, and detailed enough to be educational

REQUIRED JSON FORMAT (respond with ONLY valid JSON):
{
  "flashcards": [
    {
      "question": "Clear, specific question that promotes active recall",
      "answer": "Accurate, well-structured answer that fully addresses the question",
      "difficulty": ${targetDifficulty}
    }
  ]
}

TEXT TO PROCESS:
${text.substring(0, 15000)}

Generate exactly ${maxCards} high-quality flashcards. Return ONLY valid JSON, no other text.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Updated model (llama-3.1 deprecated)
        messages: [
          {
            role: "system",
            content: "You are an expert educator. Generate high-quality educational flashcards in valid JSON format only. Do not include any text before or after the JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("Groq response received, parsing...");

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Groq response:", content);
      throw new Error("No JSON found in Groq response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid flashcard format from Groq");
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

    console.log(`✅ Groq generated ${cleanedCards.length} flashcards`);
    return cleanedCards;
  } catch (error) {
    console.error("❌ Groq generation error:", error.message);
    throw new Error(`Failed to generate flashcards with Groq: ${error.message}`);
  }
}

module.exports = {
  generateFlashcardsWithGroq,
};
