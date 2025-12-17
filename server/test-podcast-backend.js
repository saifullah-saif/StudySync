/**
 * Test Backend Podcast API Directly
 *
 * This bypasses Next.js and tests the Express backend directly
 */

const axios = require("axios");

const BACKEND_URL = "http://localhost:5001";

async function testBackendDirectly() {
  console.log("🧪 Testing Backend Podcast API Directly\n");
  console.log("=".repeat(60));

  try {
    // First, we need to login to get a session cookie
    console.log("\n1️⃣ Logging in to get authentication cookie...");

    const loginResponse = await axios.post(
      `${BACKEND_URL}/api/auth/login`,
      {
        email: "test@example.com", // Change to a real user
        password: "password123", // Change to real password
      },
      {
        withCredentials: true,
      }
    );

    console.log("✅ Login successful");
    const cookies = loginResponse.headers["set-cookie"];
    console.log("🍪 Got cookies:", cookies);

    // Extract cookie string
    const cookieHeader = cookies ? cookies.join("; ") : "";

    // Now test saving a podcast
    console.log("\n2️⃣ Testing POST /api/podcasts (save)...");

    const saveResponse = await axios.post(
      `${BACKEND_URL}/api/podcasts`,
      {
        episodeId: `test_episode_${Date.now()}`,
        title: "Test Podcast from Direct API",
        fullText:
          "This is a test podcast text content for verification purposes.",
        duration: 120,
        wordCount: 50,
        sourceFileId: null,
        sourceType: "text",
      },
      {
        headers: {
          Cookie: cookieHeader,
        },
        withCredentials: true,
      }
    );

    console.log("✅ Save successful!");
    console.log("Response:", saveResponse.data);

    // Test fetching podcasts
    console.log("\n3️⃣ Testing GET /api/podcasts (fetch)...");

    const fetchResponse = await axios.get(`${BACKEND_URL}/api/podcasts`, {
      headers: {
        Cookie: cookieHeader,
      },
      withCredentials: true,
    });

    console.log("✅ Fetch successful!");
    console.log(`Found ${fetchResponse.data.episodes?.length || 0} podcasts`);
    console.log("Response:", JSON.stringify(fetchResponse.data, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ All tests passed!");
    console.log("\nConclusion:");
    console.log("  - Backend API is working correctly");
    console.log("  - Authentication is functional");
    console.log("  - Database persistence is working");
    console.log("  - Issue must be in Next.js API route layer");
  } catch (error) {
    console.error("\n❌ Test failed!");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else {
      console.error("Error:", error.message);
    }

    console.log("\n⚠️  Possible issues:");
    console.log("  1. Backend server not running (npm start in server/)");
    console.log("  2. Database connection issue");
    console.log("  3. Authentication middleware blocking requests");
    console.log("  4. Invalid test credentials (update email/password)");

    process.exit(1);
  }
}

// Run test
testBackendDirectly().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
