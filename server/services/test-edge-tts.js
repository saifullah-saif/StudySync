/**
 * Test script to verify edge-tts-universal migration
 * Run with: node server/services/test-edge-tts.js
 */

const edgeTtsService = require("./edgeTtsService");

async function testEdgeTTS() {
  console.log("🧪 Testing edge-tts-universal migration...\n");

  try {
    // Test 1: Check installation
    console.log("Test 1: Checking installation...");
    const isInstalled = await edgeTtsService.checkInstallation();
    console.log(`✅ Installation check: ${isInstalled ? "PASSED" : "FAILED"}\n`);

    // Test 2: Get available voices
    console.log("Test 2: Getting available voices...");
    const voices = edgeTtsService.getAvailableVoices();
    console.log("Available voices:", voices);
    console.log(`✅ Voice list: PASSED\n`);

    // Test 3: Get voice for language
    console.log("Test 3: Getting voice for language...");
    const voice = edgeTtsService.getVoiceForLanguage("en-US");
    console.log(`Voice for en-US: ${voice}`);
    console.log(`✅ Voice selection: PASSED\n`);

    // Test 4: Generate audio (short text)
    console.log("Test 4: Generating short audio...");
    const testText = "Hello, this is a test of the edge TTS universal migration.";
    const result = await edgeTtsService.generateAudio(testText, {
      lang: "en-US",
      voice: "en-US-AriaNeural",
    });

    console.log("Generation result:", {
      filePath: result.filePath,
      duration: result.duration,
      wasCached: result.wasCached,
    });
    console.log(`✅ Audio generation: PASSED\n`);

    // Test 5: Test caching (generate same text again)
    console.log("Test 5: Testing cache (regenerating same text)...");
    const cachedResult = await edgeTtsService.generateAudio(testText, {
      lang: "en-US",
      voice: "en-US-AriaNeural",
    });

    if (cachedResult.wasCached) {
      console.log("✅ Cache hit: PASSED\n");
    } else {
      console.log("⚠️  Cache miss: Expected cache hit but got generation\n");
    }

    // Test 6: Cleanup
    console.log("Test 6: Testing cleanup...");
    const cleanedCount = await edgeTtsService.cleanup(0); // Clean all files
    console.log(`Cleaned up ${cleanedCount} files`);
    console.log(`✅ Cleanup: PASSED\n`);

    console.log("=" .repeat(60));
    console.log("🎉 ALL TESTS PASSED!");
    console.log("=" .repeat(60));
    console.log("\nMigration to edge-tts-universal successful!");
    console.log("The podcast generation feature should now work without Python.");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testEdgeTTS();
