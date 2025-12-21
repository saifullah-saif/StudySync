const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("🔍 Checking for existing users...");

    // Check if any users exist
    const userCount = await prisma.users.count();
    console.log(`Found ${userCount} existing users`);

    if (userCount === 0) {
      console.log("🚀 Creating test user...");

      // Hash password
      const hashedPassword = await bcrypt.hash("password123", 10);

      // Create test user
      const user = await prisma.users.create({
        data: {
          name: "Test User",
          email: "test@studysync.com",
          password: hashedPassword,
          department: "Computer Science",
          semester: 3,
          bio: "Test user for development",
        },
      });

      console.log("✅ Test user created:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Department: ${user.department}`);
      console.log("");
      console.log("🔑 Login credentials:");
      console.log("   Email: test@studysync.com");
      console.log("   Password: password123");
    } else {
      console.log("ℹ️  Users already exist. Showing first user:");
      
      const firstUser = await prisma.users.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          created_at: true,
        },
      });

      if (firstUser) {
        console.log(`   ID: ${firstUser.id}`);
        console.log(`   Name: ${firstUser.name}`);
        console.log(`   Email: ${firstUser.email}`);
        console.log(`   Department: ${firstUser.department}`);
        console.log(`   Created: ${firstUser.created_at}`);
      }
    }

    // Check flashcard decks for user ID 1
    console.log("\n🃏 Checking flashcard decks for user ID 1...");
    const decks = await prisma.flashcard_decks.findMany({
      where: {
        user_id: 1,
        is_deleted: false,
      },
      include: {
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });

    console.log(`Found ${decks.length} flashcard decks for user ID 1:`);
    decks.forEach((deck, index) => {
      console.log(`   ${index + 1}. "${deck.title}" (${deck._count.flashcards} cards)`);
    });

    if (decks.length === 0) {
      console.log("⚠️  No flashcard decks found for user ID 1");
      console.log("   Run 'node scripts/addMockFlashcards.js' to add test data");
    }

    console.log("\n🎉 Setup complete!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
