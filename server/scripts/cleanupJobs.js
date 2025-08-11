const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupJobs() {
  try {
    console.log("🧹 Cleaning up old generation jobs...");

    // Delete all generation jobs (since we're using mock responses)
    const result = await prisma.generation_jobs.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} generation jobs`);
    console.log("🎉 Cleanup complete!");

  } catch (error) {
    console.error("❌ Error cleaning up jobs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupJobs();
