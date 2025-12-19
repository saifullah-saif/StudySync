/**
 * Test script to verify database connection and create podcasts table
 * Run this to set up the database: node test-db-setup.js
 */

require("dotenv").config();
const supabase = require("./lib/supabaseClient");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  console.log("🔧 Setting up podcasts database...\n");

  try {
    // Test 0: Verify environment variables
    console.log("0️⃣ Checking environment variables...");

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error("❌ SUPABASE_URL is not set in .env");
      process.exit(1);
    }

    if (!serviceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env");
      console.log("\n⚠️  IMPORTANT: You MUST use the SERVICE ROLE key, not the anon key!");
      console.log("\nFind it in Supabase Dashboard:");
      console.log("  Settings → API → Service Role (secret) → 'service_role' key\n");
      console.log("It should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n");
      process.exit(1);
    }

    // Verify it's not the anon key
    if (serviceRoleKey.includes("anon")) {
      console.error("❌ You're using the ANON key, not the SERVICE ROLE key!");
      console.log("\n⚠️  The anon key has limited permissions and cannot write to tables.");
      console.log("\nPlease use the SERVICE ROLE key from:");
      console.log("  Supabase Dashboard → Settings → API → 'service_role' (not 'anon')\n");
      process.exit(1);
    }

    console.log("✅ Environment variables found");
    console.log(`   SUPABASE_URL: ${supabaseUrl}`);
    console.log(`   SERVICE_ROLE_KEY: ${serviceRoleKey.substring(0, 20)}...`);
    console.log("");

    // Test 1: Check Supabase connection
    console.log("1️⃣ Testing Supabase connection...");
    const { data: testData, error: testError } = await supabase
      .from("files")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Supabase connection failed:", testError.message);
      console.log("\nCheck your .env file:");
      console.log("- SUPABASE_URL");
      console.log("- SUPABASE_SERVICE_ROLE_KEY");
      process.exit(1);
    }

    console.log("✅ Supabase connection successful\n");

    // Test 2: Check if podcasts table exists
    console.log("2️⃣ Checking if podcasts table exists...");
    const { data: checkData, error: checkError } = await supabase
      .from("podcasts")
      .select("count")
      .limit(1);

    if (checkError && checkError.message.includes("does not exist")) {
      console.log("⚠️  Podcasts table does not exist\n");
      console.log("📋 Please run the migration SQL manually:\n");
      console.log("1. Open Supabase Dashboard → SQL Editor");
      console.log(
        "2. Copy contents of: server/migrations/001_create_podcasts_table_v2.sql"
      );
      console.log("3. Paste and click 'Run'\n");
      console.log("Or copy this SQL:\n");
      console.log("─".repeat(60));

      const sqlPath = path.join(
        __dirname,
        "migrations",
        "001_create_podcasts_table_v2.sql"
      );
      const sql = fs.readFileSync(sqlPath, "utf-8");
      console.log(sql);

      console.log("─".repeat(60));
      process.exit(1);
    } else if (checkError) {
      console.error("❌ Error checking table:", checkError.message);
      process.exit(1);
    }

    console.log("✅ Podcasts table exists\n");

    // Test 3: Verify table schema
    console.log("3️⃣ Verifying table schema...");

    // Try to insert a test record
    const testPodcast = {
      user_id: "test-user-123",
      file_id: "test-file-456",
      title: "Test Podcast",
      status: "pending",
      tts_text: "This is a test podcast",
      char_count: 23,
      word_count: 5,
      lang: "en",
      voice_id: "en-US-AriaNeural",
    };

    const { data: insertData, error: insertError } = await supabase
      .from("podcasts")
      .insert(testPodcast)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Schema validation failed:", insertError.message);
      console.log("\nThe table might have wrong columns.");
      console.log("Try dropping and recreating the table.\n");
      process.exit(1);
    }

    console.log("✅ Schema validation passed");
    console.log("   Test podcast created:", insertData.id, "\n");

    // Clean up test record
    const { error: deleteError } = await supabase
      .from("podcasts")
      .delete()
      .eq("id", insertData.id);

    if (deleteError) {
      console.warn("⚠️  Could not delete test record:", deleteError.message);
    } else {
      console.log("✅ Test record cleaned up\n");
    }

    // Test 4: Check storage bucket
    console.log("4️⃣ Checking Supabase Storage bucket...");

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Could not list buckets:", bucketsError.message);
    } else {
      const podcastBucket = buckets.find((b) => b.name === "podcasts");

      if (!podcastBucket) {
        console.log("⚠️  'podcasts' bucket does not exist\n");
        console.log("📋 Please create the bucket:\n");
        console.log("1. Open Supabase Dashboard → Storage");
        console.log("2. Click 'New Bucket'");
        console.log("3. Name: podcasts");
        console.log("4. Public: Yes");
        console.log("5. Click 'Create Bucket'\n");
      } else {
        console.log("✅ 'podcasts' bucket exists");
        console.log(
          `   Public: ${podcastBucket.public ? "Yes" : "No (you may want to make it public)"}\n`
        );
      }
    }

    console.log("═".repeat(60));
    console.log("🎉 Database setup complete!");
    console.log("═".repeat(60));
    console.log("\n✅ Your database is ready for podcast generation.\n");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

setupDatabase();
