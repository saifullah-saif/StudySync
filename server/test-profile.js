const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testProfileUpdate() {
  try {
    console.log("Testing database connection...");
    
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Find a test user
    const testUser = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        semester: true,
        bio: true
      }
    });

    if (!testUser) {
      console.log("❌ No users found in database");
      return;
    }

    console.log("✅ Found test user:", testUser);

    // Test simple update
    console.log("Testing profile update...");
    try {
      const updatedUser = await prisma.users.update({
        where: { id: testUser.id },
        data: {
          bio: "Updated bio - " + new Date().toISOString()
        },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          semester: true,
          bio: true
        }
      });

      console.log("✅ Profile updated successfully:", updatedUser);
    } catch (updateError) {
      console.log("❌ Profile update failed:", updateError.message);

      // Try a simpler update
      console.log("Trying simpler update...");
      const simpleUpdate = await prisma.users.findUnique({
        where: { id: testUser.id }
      });
      console.log("✅ User found for simple test:", simpleUpdate ? "Yes" : "No");
    }

    // Test courses query
    console.log("Testing courses query...");
    const userCourses = await prisma.user_courses.findMany({
      where: {
        user_id: testUser.id,
        is_completed: false
      },
      include: {
        courses: {
          select: {
            course_name: true,
            course_code: true
          }
        }
      }
    });

    console.log("✅ User courses:", userCourses);

    // Test course reviews query
    const courseReviews = await prisma.course_reviews.findMany({
      where: {
        user_id: testUser.id
      },
      include: {
        courses: {
          select: {
            course_name: true,
            course_code: true
          }
        }
      }
    });

    console.log("✅ Course reviews:", courseReviews);

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileUpdate();
