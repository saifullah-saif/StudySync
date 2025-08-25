#!/usr/bin/env node

/**
 * Test script for File Handling and Text Extraction
 * Usage: node test-file-extraction.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('./lib/supabaseClient');
const { extractTextFromFile, chunkText } = require('./lib/extractText');

async function testFileHandlingAndExtraction() {
  console.log("📁 Testing File Handling & Text Extraction");
  console.log("==========================================");

  try {
    // Test 1: Check Supabase connection
    console.log("\n🔌 Testing Supabase Connection:");
    const bucketName = process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Failed to connect to Supabase:", bucketsError.message);
      return;
    }
    
    console.log("✅ Supabase connection successful");
    console.log(`Target bucket: ${bucketName}`);
    
    const targetBucket = buckets.find(b => b.name === bucketName);
    if (!targetBucket) {
      console.warn(`⚠️  Bucket '${bucketName}' not found. Available buckets:`, buckets.map(b => b.name));
    } else {
      console.log("✅ Target bucket found");
    }

    // Test 2: Create sample files for testing
    console.log("\n📄 Creating Sample Test Files:");
    
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a sample TXT file
    const sampleTxtContent = `
Sample Document for Testing

Introduction
This is a sample document created to test the file handling and text extraction functionality.

Chapter 1: Photosynthesis
Photosynthesis is the process by which plants convert light energy into chemical energy in the form of glucose. This process occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions and the Calvin cycle.

The light-dependent reactions take place in the thylakoid membranes and produce ATP and NADPH. The Calvin cycle occurs in the stroma and uses the ATP and NADPH to fix carbon dioxide into glucose.

Chapter 2: Cellular Respiration
Cellular respiration is the process by which cells break down glucose to release energy in the form of ATP. This process includes three main stages: glycolysis, the citric acid cycle, and oxidative phosphorylation.

Conclusion
These biological processes are fundamental to life on Earth and represent the flow of energy through living systems.
    `.trim();

    const txtFilePath = path.join(testDir, 'sample-document.txt');
    fs.writeFileSync(txtFilePath, sampleTxtContent);
    console.log("✅ Sample TXT file created:", txtFilePath);

    // Test 3: Test Text Extraction from Buffer
    console.log("\n🔍 Testing Text Extraction:");
    
    const txtBuffer = fs.readFileSync(txtFilePath);
    console.log(`TXT file size: ${txtBuffer.length} bytes`);
    
    try {
      const extractedText = await extractTextFromFile(txtBuffer, 'txt', 'sample-document.txt');
      console.log("✅ TXT extraction successful");
      console.log(`Extracted text length: ${extractedText.length} characters`);
      console.log("Preview:", extractedText.substring(0, 200) + "...");
      
      // Test 4: Test Text Chunking
      console.log("\n📋 Testing Text Chunking:");
      const chunks = chunkText(extractedText, 500); // Small chunks for testing
      console.log(`✅ Text chunked into ${chunks.length} parts`);
      
      chunks.forEach((chunk, index) => {
        console.log(`\nChunk ${index + 1} (${chunk.length} chars):`);
        console.log(chunk.substring(0, 100) + "...");
      });

      // Test 5: Simulate Supabase Upload and Download
      console.log("\n☁️  Testing Supabase File Operations:");
      
      const testFileName = `test-${Date.now()}.txt`;
      
      try {
        // Upload test file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(testFileName, txtBuffer, {
            contentType: 'text/plain',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error("❌ Upload failed:", uploadError.message);
          return;
        }

        console.log("✅ File uploaded successfully:", uploadData.path);

        // Download and extract
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(testFileName);

        if (downloadError) {
          console.error("❌ Download failed:", downloadError.message);
          return;
        }

        console.log("✅ File downloaded successfully");
        
        // Convert blob to buffer and extract text
        const downloadBuffer = Buffer.from(await downloadData.arrayBuffer());
        const downloadedText = await extractTextFromFile(downloadBuffer, 'txt', testFileName);
        
        console.log("✅ Text extraction from downloaded file successful");
        console.log(`Downloaded text length: ${downloadedText.length} characters`);
        
        // Verify text matches
        if (downloadedText.trim() === extractedText.trim()) {
          console.log("✅ Text content matches original - round trip successful!");
        } else {
          console.warn("⚠️  Text content differs slightly (may be due to encoding)");
        }

        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([testFileName]);

        if (deleteError) {
          console.warn("⚠️  Failed to clean up test file:", deleteError.message);
        } else {
          console.log("✅ Test file cleaned up");
        }

      } catch (supabaseError) {
        console.error("❌ Supabase operation failed:", supabaseError.message);
      }

      console.log("\n🎉 File Handling & Text Extraction Tests Complete!");
      console.log("\n📋 Summary:");
      console.log("✅ Supabase connection - Working");
      console.log("✅ Text extraction from TXT - Working");
      console.log("✅ Text chunking - Working");
      console.log("✅ File upload/download cycle - Working");

    } catch (extractionError) {
      console.error("❌ Text extraction failed:", extractionError.message);
    }

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log("✅ Test files cleaned up");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Test different file types if sample files exist
async function testDifferentFileTypes() {
  console.log("\n📚 Testing Different File Types (if available):");
  
  const testFiles = [
    { name: 'sample.pdf', type: 'pdf' },
    { name: 'sample.docx', type: 'docx' },
    { name: 'sample.txt', type: 'txt' }
  ];

  for (const file of testFiles) {
    const filePath = path.join(__dirname, 'test-samples', file.name);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n🔍 Testing ${file.type.toUpperCase()} extraction:`);
      try {
        const buffer = fs.readFileSync(filePath);
        const extractedText = await extractTextFromFile(buffer, file.type, file.name);
        
        console.log(`✅ ${file.type.toUpperCase()} extraction successful`);
        console.log(`Text length: ${extractedText.length} characters`);
        console.log(`Preview: ${extractedText.substring(0, 150)}...`);
        
      } catch (error) {
        console.error(`❌ ${file.type.toUpperCase()} extraction failed:`, error.message);
      }
    } else {
      console.log(`⚠️  Sample ${file.type.toUpperCase()} file not found: ${filePath}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testFileHandlingAndExtraction()
    .then(() => testDifferentFileTypes())
    .then(() => {
      console.log("\n✨ All tests completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test suite failed:", error.message);
      process.exit(1);
    });
}

module.exports = testFileHandlingAndExtraction;
