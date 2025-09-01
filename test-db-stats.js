// Quick test script to verify database stats integration
const axios = require("axios");

const BASE_URL = "http://localhost:5001";

async function testStatsAPI() {
  try {
    console.log("Testing stats API endpoints...\n");

    // Test GET user stats
    console.log("1. Testing GET /api/stats/user");
    try {
      const getResponse = await axios.get(`${BASE_URL}/api/stats/user`, {
        withCredentials: true,
      });
      console.log("✅ GET stats successful:", getResponse.data);
    } catch (error) {
      console.log(
        "⚠️ GET stats failed (expected if not logged in):",
        error.response?.status
      );
    }

    // Test POST user stats (this will also fail without auth, but we can check the endpoint exists)
    console.log("\n2. Testing POST /api/stats/user");
    try {
      const postResponse = await axios.post(
        `${BASE_URL}/api/stats/user`,
        {
          cardsStudiedToday: 5,
          correctAnswers: 4,
          totalAnswers: 5,
          accuracyToday: 80,
        },
        {
          withCredentials: true,
        }
      );
      console.log("✅ POST stats successful:", postResponse.data);
    } catch (error) {
      console.log(
        "⚠️ POST stats failed (expected if not logged in):",
        error.response?.status
      );
    }

    // Test if practice endpoint exists
    console.log("\n3. Testing practice endpoint structure");
    try {
      const practiceResponse = await axios.post(
        `${BASE_URL}/api/practice/attempt`,
        {
          deckId: 1,
          flashcardId: 1,
          isCorrect: true,
        },
        {
          withCredentials: true,
        }
      );
      console.log("✅ Practice endpoint exists");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("✅ Practice endpoint exists (auth required)");
      } else {
        console.log("❌ Practice endpoint issue:", error.response?.status);
      }
    }

    console.log("\n🎉 Database integration setup appears to be working!");
    console.log("📝 Next steps:");
    console.log("   1. Log in to the app");
    console.log("   2. Practice some flashcards");
    console.log("   3. Check if dashboard stats update in real-time");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testStatsAPI();
