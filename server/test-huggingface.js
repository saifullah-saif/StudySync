#!/usr/bin/env node

/**
 * Test script for Hugging Face service
 * Usage: node test-huggingface.js
 */

require('dotenv').config();
const huggingfaceService = require('./services/huggingfaceService');

async function testHuggingFaceService() {
  console.log("🧪 Testing Hugging Face Service");
  console.log("================================");

  try {
    // Test 1: Check configuration
    console.log("\n📋 Configuration Check:");
    console.log(`API Key: ${process.env.HUGGINGFACE_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`Model: ${process.env.HF_MODEL || 'google/flan-t5-large'}`);
    console.log(`Max Tokens: ${process.env.HF_MAX_NEW_TOKENS || 512}`);
    console.log(`Temperature: ${process.env.HF_TEMPERATURE || 0.3}`);

    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error("❌ HUGGINGFACE_API_KEY not found in .env file");
      process.exit(1);
    }

    // Test 2: API Connection
    console.log("\n🔌 Testing API Connection:");
    const connectionTest = await huggingfaceService.testConnection();
    
    if (!connectionTest.success) {
      console.error("❌ Connection test failed:", connectionTest.error);
      process.exit(1);
    }

    console.log("✅ Connection successful");
    console.log("Response preview:", connectionTest.response);

    // Test 3: Simple Flashcard Generation
    console.log("\n🎯 Testing Flashcard Generation:");
    const sampleText = `
      Photosynthesis is the process by which plants convert light energy into chemical energy. 
      This process occurs in the chloroplasts of plant cells and involves two main stages: 
      the light-dependent reactions and the Calvin cycle. During photosynthesis, plants absorb 
      carbon dioxide from the air and water from the soil to produce glucose and oxygen.
    `;

    const flashcards = await huggingfaceService.generateFlashcards(sampleText, {
      cardCount: 3,
      cardType: "basic",
      difficulty: "medium"
    });

    console.log("✅ Flashcard generation successful!");
    console.log(`Generated ${flashcards.length} flashcards:`);
    
    flashcards.forEach((card, index) => {
      console.log(`\n📝 Card ${index + 1}:`);
      console.log(`Q: ${card.question}`);
      console.log(`A: ${card.answer}`);
      console.log(`Difficulty: ${card.difficulty_level}`);
    });

    console.log("\n🎉 All tests passed! Hugging Face service is working correctly.");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testHuggingFaceService()
    .then(() => {
      console.log("\n✨ Test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test suite failed:", error.message);
      process.exit(1);
    });
}

module.exports = testHuggingFaceService;
