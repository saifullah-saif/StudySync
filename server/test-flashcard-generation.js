/**
 * Test Flashcard Generation Endpoint
 * Run this to debug 500 errors
 */

const axios = require("axios");

const BACKEND_URL = "http://localhost:5001";

async function testFlashcardGeneration() {
  try {
    console.log("🧪 Testing Flashcard Generation Endpoint\n");

    // Step 1: Login to get auth token
    console.log("1️⃣ Logging in...");
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: "test@example.com", // Change to your test user
      password: "password123", // Change to your test password
    });

    const cookies = loginResponse.headers["set-cookie"];
    const token = cookies?.find((c) => c.startsWith("token="))?.split(";")[0];

    console.log("✅ Login successful");
    console.log("🍪 Cookies:", cookies);
    console.log("🎫 Token:", token);

    // Step 2: Test flashcard generation with minimal data
    console.log("\n2️⃣ Testing flashcard generation...");

    const testData = {
      text: `
        Magnetic Disk
        
        A magnetic disk is a storage device that uses a magnetization process to write,
        rewrite and access data. It is covered with a magnetic coating and stores data in the
        form of tracks, and sectors. Magnetic disks are flat circular plates of metal or plastic,
        coated on both sides with iron oxide.
        
        Data on a magnetic disk is read and written using a magnetization process.
        The disk is divided into tracks and sectors for organized data storage.
        Read-write arms with heads on both sides access the data.
        Magnetic disks have traditionally been used as primary storage in computers.
      `.trim(),
      deckTitle: "Test Flashcards",
      maxCards: 5,
      difficultyLevel: "medium",
    };

    console.log("📦 Request data:", {
      textLength: testData.text.length,
      deckTitle: testData.deckTitle,
      maxCards: testData.maxCards,
      difficultyLevel: testData.difficultyLevel,
    });

    const flashcardResponse = await axios.post(
      `${BACKEND_URL}/api/documents/generate-flashcards`,
      testData,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: token || cookies?.join("; "),
        },
        withCredentials: true,
      }
    );

    console.log("\n✅ Flashcard generation successful!");
    console.log(
      "📊 Response:",
      JSON.stringify(flashcardResponse.data, null, 2)
    );
  } catch (error) {
    console.error("\n❌ Test failed!");

    if (error.response) {
      console.error("📛 Status:", error.response.status);
      console.error("📛 Status Text:", error.response.statusText);
      console.error(
        "📛 Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
      console.error("📛 Response Headers:", error.response.headers);
    } else if (error.request) {
      console.error("📛 No response received");
      console.error("📛 Request:", error.request);
    } else {
      console.error("📛 Error:", error.message);
    }

    console.error("\n📛 Full error:", error);
  }
}

// Run the test
testFlashcardGeneration();
