const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addMockFlashcards() {
  try {
    console.log("🚀 Adding mock flashcard data...");

    // Create a mock deck
    const deck = await prisma.flashcard_decks.create({
      data: {
        user_id: 1, // Assuming user ID 1 exists
        title: "Data Structures & Algorithms",
        description: "Essential concepts for computer science",
        creation_method: "ai_generated",
        color: "#3B82F6",
      },
    });

    console.log("✅ Created deck:", deck.title);

    // Create mock flashcards
    const flashcards = [
      {
        question: "What is a data structure?",
        answer: "A data structure is a way of organizing, managing, and storing data in a computer so it can be used efficiently.",
        explanation: "Data structures provide a means to manage large amounts of data efficiently for uses such as large databases and internet indexing services.",
        difficulty_level: 2,
        card_type: "basic",
      },
      {
        question: "What is the time complexity of binary search?",
        answer: "O(log n)",
        explanation: "Binary search divides the search space in half with each comparison, resulting in logarithmic time complexity.",
        difficulty_level: 3,
        card_type: "basic",
      },
      {
        question: "Which data structure uses LIFO (Last In, First Out) principle?",
        answer: "Stack",
        explanation: "A stack is a linear data structure that follows the LIFO principle, where the last element added is the first one to be removed.",
        difficulty_level: 2,
        card_type: "basic",
      },
      {
        question: "What is the worst-case time complexity of quicksort?",
        answer: "O(n²)",
        explanation: "Quicksort has O(n²) worst-case time complexity when the pivot is always the smallest or largest element, but O(n log n) average case.",
        difficulty_level: 4,
        card_type: "basic",
      },
      {
        question: "Which of the following is NOT a characteristic of a hash table?",
        answer: "Maintains sorted order",
        explanation: "Hash tables do not maintain sorted order. They provide fast insertion, deletion, and lookup operations but elements are not stored in any particular order.",
        difficulty_level: 3,
        card_type: "multiple_choice",
      },
    ];

    for (let i = 0; i < flashcards.length; i++) {
      const flashcard = await prisma.flashcards.create({
        data: {
          deck_id: deck.id,
          ...flashcards[i],
          auto_generated: true,
          confidence_score: 0.85,
        },
      });

      // Add multiple choice options for the last card
      if (flashcard.card_type === "multiple_choice") {
        const options = [
          { option_text: "Fast insertion and deletion", is_correct: false, option_order: 0 },
          { option_text: "Constant time lookup", is_correct: false, option_order: 1 },
          { option_text: "Maintains sorted order", is_correct: true, option_order: 2 },
          { option_text: "Uses hash function", is_correct: false, option_order: 3 },
        ];

        for (const option of options) {
          await prisma.flashcard_options.create({
            data: {
              flashcard_id: flashcard.id,
              ...option,
            },
          });
        }
      }

      console.log(`✅ Created flashcard ${i + 1}: ${flashcard.question.substring(0, 50)}...`);
    }

    // Create another deck
    const deck2 = await prisma.flashcard_decks.create({
      data: {
        user_id: 1,
        title: "JavaScript Fundamentals",
        description: "Core JavaScript concepts and features",
        creation_method: "ai_generated",
        color: "#F59E0B",
      },
    });

    console.log("✅ Created deck:", deck2.title);

    const jsFlashcards = [
      {
        question: "What is closure in JavaScript?",
        answer: "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned.",
        explanation: "Closures are created every time a function is created, at function creation time. They allow for data privacy and function factories.",
        difficulty_level: 3,
        card_type: "basic",
      },
      {
        question: "What is the difference between let and var?",
        answer: "let has block scope while var has function scope. let cannot be redeclared in the same scope.",
        explanation: "let was introduced in ES6 to solve issues with var's function scoping and hoisting behavior.",
        difficulty_level: 2,
        card_type: "basic",
      },
      {
        question: "What does 'this' refer to in JavaScript?",
        answer: "The value of 'this' depends on how a function is called. It refers to the object that is executing the current function.",
        explanation: "In methods, 'this' refers to the owner object. In functions, 'this' refers to the global object (or undefined in strict mode).",
        difficulty_level: 4,
        card_type: "basic",
      },
    ];

    for (let i = 0; i < jsFlashcards.length; i++) {
      const flashcard = await prisma.flashcards.create({
        data: {
          deck_id: deck2.id,
          ...jsFlashcards[i],
          auto_generated: true,
          confidence_score: 0.90,
        },
      });

      console.log(`✅ Created JS flashcard ${i + 1}: ${flashcard.question.substring(0, 50)}...`);
    }

    console.log("🎉 Mock flashcard data added successfully!");
    console.log(`Created ${flashcards.length + jsFlashcards.length} flashcards in 2 decks`);

  } catch (error) {
    console.error("❌ Error adding mock data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMockFlashcards();
