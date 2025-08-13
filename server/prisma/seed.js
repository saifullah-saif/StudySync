const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedCourses() {
  const courses = [
    {
      course_code: "CSE220",
      course_name: "Data Structures",
      department: "Computer Science and Engineering",
      credit_hours: 3,
      description: "Introduction to fundamental data structures and algorithms",
      difficulty: "Intermediate",
      course_type: "Core",
      prerequisites: ["CSE110"],
    },
    {
      course_code: "CSE370",
      course_name: "Database Systems",
      department: "Computer Science and Engineering",
      credit_hours: 3,
      description: "Database design, SQL, and database management systems",
      difficulty: "Intermediate",
      course_type: "Core",
      prerequisites: ["CSE220"],
    },
    {
      course_code: "CSE425",
      course_name: "Artificial Intelligence",
      department: "Computer Science and Engineering",
      credit_hours: 3,
      description: "Introduction to AI concepts and machine learning",
      difficulty: "Advanced",
      course_type: "Core",
      prerequisites: ["CSE220", "CSE321"],
    },
    {
      course_code: "MAT120",
      course_name: "Calculus I",
      department: "Mathematics",
      credit_hours: 3,
      description: "Differential and integral calculus",
      difficulty: "Intermediate",
      course_type: "Core",
      prerequisites: [],
    },
    {
      course_code: "PHY101",
      course_name: "Physics I",
      department: "Physics",
      credit_hours: 3,
      description: "Classical mechanics and thermodynamics",
      difficulty: "Beginner",
      course_type: "Core",
      prerequisites: ["MAT120"],
    },
    {
      course_code: "CSE110",
      course_name: "Programming Language I",
      department: "Computer Science and Engineering",
      credit_hours: 3,
      description: "Introduction to programming with C",
      difficulty: "Beginner",
      course_type: "Core",
      prerequisites: [],
    },
    {
      course_code: "CSE321",
      course_name: "Algorithms",
      department: "Computer Science and Engineering",
      credit_hours: 3,
      description: "Algorithm design and analysis",
      difficulty: "Advanced",
      course_type: "Core",
      prerequisites: ["CSE220"],
    },
  ];

  console.log("Seeding courses...");

  for (const course of courses) {
    try {
      const existingCourse = await prisma.courses.findUnique({
        where: { course_code: course.course_code },
      });

      if (!existingCourse) {
        await prisma.courses.create({
          data: course,
        });
        console.log(
          `✅ Created course: ${course.course_code} - ${course.course_name}`
        );
      } else {
        console.log(`⏭️  Course already exists: ${course.course_code}`);
      }
    } catch (error) {
      console.error(`❌ Error creating course ${course.course_code}:`, error);
    }
  }

  console.log("Course seeding completed!");
}

async function main() {
  try {
    await seedCourses();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
