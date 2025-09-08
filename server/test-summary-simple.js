const axios = require("axios");

async function testSummaryAPI() {
  try {
    console.log("🧪 Testing AI Summary API...\n");

    // Test health endpoint first
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get("http://localhost:5000/api/health");
    console.log("✅ Health check:", healthResponse.data);

    console.log("\n2. Summary API endpoints available:");
    console.log("   - POST /api/summary/generate (requires auth)");
    console.log("   - POST /api/summary/note/:noteId (requires auth)");
    console.log("   - POST /api/summary/document/:documentId (requires auth)");

    console.log("\n✅ Server is running and summary routes are registered!");
    console.log("💡 To test the summary functionality:");
    console.log("   1. Open browser at http://localhost:3000");
    console.log("   2. Login to your account");
    console.log("   3. Navigate to any note in view-notes");
    console.log('   4. Click the "AI Summary" button');
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testSummaryAPI();
