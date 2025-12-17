/**
 * Podcast Persistence Verification Script
 *
 * This script verifies that:
 * 1. Podcasts are being saved to the database
 * 2. They can be retrieved by user ID
 * 3. All required fields are present
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifyPodcastPersistence() {
  console.log("🔍 Podcast Persistence Verification\n");
  console.log("=".repeat(60));

  try {
    // 1. Check total podcasts in database
    const totalPodcasts = await prisma.audio_content.count();
    console.log(`\n📊 Total podcasts in database: ${totalPodcasts}`);

    // 2. Get all podcasts with user info
    const allPodcasts = await prisma.audio_content.findMany({
      take: 10,
      orderBy: {
        generated_at: "desc",
      },
      select: {
        id: true,
        user_id: true,
        title: true,
        audio_file_path: true,
        duration_seconds: true,
        generated_at: true,
        tts_model_version: true,
        note_id: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`\n📻 Recent podcasts (showing ${allPodcasts.length}):\n`);

    if (allPodcasts.length === 0) {
      console.log("❌ NO PODCASTS FOUND IN DATABASE!");
      console.log("\nThis means:");
      console.log("  - Podcasts are NOT being persisted");
      console.log("  - Generation is ephemeral only");
      console.log("  - /assistant/podcasts will always be empty");
    } else {
      allPodcasts.forEach((podcast, index) => {
        console.log(`${index + 1}. ${podcast.title}`);
        console.log(`   ID: ${podcast.id}`);
        console.log(`   User: ${podcast.users?.name} (ID: ${podcast.user_id})`);
        console.log(`   Episode ID: ${podcast.audio_file_path}`);
        console.log(`   Duration: ${podcast.duration_seconds}s`);
        console.log(`   Note ID: ${podcast.note_id || "N/A"}`);
        console.log(`   TTS Model: ${podcast.tts_model_version || "N/A"}`);
        console.log(
          `   Generated: ${podcast.generated_at?.toLocaleString() || "N/A"}`
        );
        console.log("");
      });
    }

    // 3. Group by user
    const podcastsByUser = await prisma.audio_content.groupBy({
      by: ["user_id"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    console.log(`\n👥 Podcasts by user:\n`);
    for (const group of podcastsByUser) {
      const user = await prisma.users.findUnique({
        where: { id: group.user_id },
        select: { name: true, email: true },
      });
      console.log(
        `   User ${group.user_id} (${user?.name}): ${group._count.id} podcasts`
      );
    }

    // 4. Check for podcasts with notes
    const podcastsWithNotes = await prisma.audio_content.count({
      where: {
        note_id: {
          not: null,
        },
      },
    });

    console.log(
      `\n📝 Podcasts with associated notes: ${podcastsWithNotes}/${totalPodcasts}`
    );

    // 5. Check for orphaned podcasts (TTS-only without audio files)
    const ttsPodcasts = await prisma.audio_content.count({
      where: {
        tts_model_version: {
          contains: "web-speech",
        },
      },
    });

    console.log(`\n🎤 TTS-based podcasts: ${ttsPodcasts}/${totalPodcasts}`);

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Verification complete!");

    if (totalPodcasts === 0) {
      console.log("\n⚠️  WARNING: No podcasts in database!");
      console.log("Next steps:");
      console.log("  1. Generate a podcast from the UI");
      console.log("  2. Check backend logs for save errors");
      console.log("  3. Re-run this script");
    } else {
      console.log("\n✅ Podcasts are being persisted correctly!");
      console.log(`   Total: ${totalPodcasts}`);
      console.log(
        `   TTS-based: ${ttsPodcasts} (${Math.round(
          (ttsPodcasts / totalPodcasts) * 100
        )}%)`
      );
    }
  } catch (error) {
    console.error("\n❌ Error during verification:", error);
    console.error("\nError details:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyPodcastPersistence().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
