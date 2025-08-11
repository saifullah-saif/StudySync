const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const templates = [
  {
    name: "Basic Flashcards - Easy",
    description: "Generate easy difficulty basic question-answer flashcards",
    card_type: "basic",
    target_difficulty: 2,
    is_default: true,
    prompt_template: `You are an expert educator creating easy difficulty flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of flashcards
- Each flashcard should test basic concepts from the text
- Questions should be easy difficulty level (straightforward, factual)
- Answers should be concise but complete
- Focus on key definitions, basic facts, and simple concepts
- Avoid complex analysis or synthesis questions

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "answer": "Concise, accurate answer",
      "explanation": "Brief explanation or additional context (optional)",
      "difficulty_level": 2,
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} flashcards. Return only valid JSON.`,
  },
  {
    name: "Basic Flashcards - Medium",
    description: "Generate medium difficulty basic question-answer flashcards",
    card_type: "basic",
    target_difficulty: 3,
    is_default: true,
    prompt_template: `You are an expert educator creating medium difficulty flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of flashcards
- Each flashcard should test important concepts from the text
- Questions should be medium difficulty level
- Answers should be concise but complete
- Include brief explanations when helpful
- Focus on key concepts, definitions, processes, and relationships
- Avoid trivial details or overly specific information

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "answer": "Concise, accurate answer",
      "explanation": "Brief explanation or additional context (optional)",
      "difficulty_level": 3,
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} flashcards. Return only valid JSON.`,
  },
  {
    name: "Basic Flashcards - Hard",
    description: "Generate hard difficulty basic question-answer flashcards",
    card_type: "basic",
    target_difficulty: 4,
    is_default: true,
    prompt_template: `You are an expert educator creating hard difficulty flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of flashcards
- Each flashcard should test complex concepts from the text
- Questions should be hard difficulty level (require analysis, synthesis, application)
- Answers should be comprehensive and detailed
- Include explanations that connect concepts
- Focus on relationships between concepts, applications, and critical thinking
- Test understanding rather than memorization

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "answer": "Comprehensive, accurate answer",
      "explanation": "Detailed explanation connecting concepts",
      "difficulty_level": 4,
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} flashcards. Return only valid JSON.`,
  },
  {
    name: "Multiple Choice - Easy",
    description: "Generate easy difficulty multiple choice flashcards",
    card_type: "multiple_choice",
    target_difficulty: 2,
    is_default: true,
    prompt_template: `You are an expert educator creating easy difficulty multiple choice flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of multiple choice flashcards
- Each flashcard should test basic concepts from the text
- Questions should be easy difficulty level (straightforward, factual)
- Provide 4 options (A, B, C, D) with exactly one correct answer
- Make incorrect options plausible but clearly wrong
- Include brief explanations for the correct answers
- Focus on key definitions, basic facts, and simple concepts

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "options": [
        {"text": "Option A text", "is_correct": false},
        {"text": "Option B text", "is_correct": true},
        {"text": "Option C text", "is_correct": false},
        {"text": "Option D text", "is_correct": false}
      ],
      "explanation": "Brief explanation of why the correct answer is right",
      "difficulty_level": 2,
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} multiple choice flashcards. Return only valid JSON.`,
  },
  {
    name: "Multiple Choice - Medium",
    description: "Generate medium difficulty multiple choice flashcards",
    card_type: "multiple_choice",
    target_difficulty: 3,
    is_default: true,
    prompt_template: `You are an expert educator creating medium difficulty multiple choice flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of multiple choice flashcards
- Each flashcard should test important concepts from the text
- Questions should be medium difficulty level
- Provide 4 options (A, B, C, D) with exactly one correct answer
- Make incorrect options plausible but clearly wrong
- Include brief explanations for the correct answers
- Focus on key concepts, definitions, processes, and relationships
- Avoid trivial details or overly specific information

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "options": [
        {"text": "Option A text", "is_correct": false},
        {"text": "Option B text", "is_correct": true},
        {"text": "Option C text", "is_correct": false},
        {"text": "Option D text", "is_correct": false}
      ],
      "explanation": "Brief explanation of why the correct answer is right",
      "difficulty_level": 3,
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} multiple choice flashcards. Return only valid JSON.`,
  },
  {
    name: "Multiple Choice - Hard",
    description: "Generate hard difficulty multiple choice flashcards",
    card_type: "multiple_choice",
    target_difficulty: 4,
    is_default: true,
    prompt_template: `You are an expert educator creating hard difficulty multiple choice flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of multiple choice flashcards
- Each flashcard should test complex concepts from the text
- Questions should be hard difficulty level (require analysis, synthesis, application)
- Provide 4 options (A, B, C, D) with exactly one correct answer
- Make incorrect options sophisticated and challenging
- Include detailed explanations for the correct answers
- Focus on relationships between concepts, applications, and critical thinking
- Test understanding and application rather than memorization

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "options": [
        {"text": "Option A text", "is_correct": false},
        {"text": "Option B text", "is_correct": true},
        {"text": "Option C text", "is_correct": false},
        {"text": "Option D text", "is_correct": false}
      ],
      "explanation": "Detailed explanation of why the correct answer is right and why others are wrong",
      "difficulty_level": 4,
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} multiple choice flashcards. Return only valid JSON.`,
  },
];

async function setupGenerationTemplates() {
  try {
    console.log("Setting up generation templates...");

    for (const template of templates) {
      // Check if template already exists
      const existing = await prisma.generation_templates.findFirst({
        where: {
          name: template.name,
        },
      });

      if (existing) {
        console.log(`Template "${template.name}" already exists, updating...`);
        await prisma.generation_templates.update({
          where: { id: existing.id },
          data: template,
        });
      } else {
        console.log(`Creating template "${template.name}"...`);
        await prisma.generation_templates.create({
          data: template,
        });
      }
    }

    console.log("Generation templates setup completed successfully!");
  } catch (error) {
    console.error("Error setting up generation templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupGenerationTemplates()
    .then(() => {
      console.log("Setup completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { setupGenerationTemplates };
