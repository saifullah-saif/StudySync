const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class ProfileService {
  static instance = null;

  static getInstance() {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  // Get user profile with courses and reviews
  async getUserProfile(userId) {
    try {
      // Get user basic information
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          semester: true,
          bio: true,
          profile_picture_url: true,
          cgpa: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get current courses (not completed)
      const currentCourses = await prisma.user_courses.findMany({
        where: {
          user_id: userId,
          is_completed: false,
        },
        include: {
          courses: {
            select: {
              course_name: true,
              course_code: true,
            },
          },
        },
      });

      // Get completed courses with reviews
      const completedCoursesWithReviews = await prisma.course_reviews.findMany({
        where: {
          user_id: userId,
        },
        include: {
          courses: {
            select: {
              course_name: true,
              course_code: true,
            },
          },
        },
      });

      // Format current courses - return course codes instead of names
      const courses = currentCourses.map((uc) => uc.courses.course_code);

      // Format completed courses with reviews - use course codes
      const completedCourses = completedCoursesWithReviews.map((review) => ({
        name: review.courses.course_code,
        rating: review.difficulty_rating,
        review: review.review_text || "No review provided",
      }));

      return {
        ...user,
        courses,
        completedCourses,
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      console.log("ProfileService: updateUserProfile called with:", { userId, updateData });

      const { name, email, department, semester, bio, courses } = updateData;

      // Validate userId
      if (!userId || typeof userId !== 'number') {
        throw new Error(`Invalid user ID: ${userId}`);
      }

      // Check if user exists first
      const existingUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!existingUser) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      console.log("User exists, proceeding with update");

      // Prepare update data - only include fields that are provided
      const updateFields = {};
      if (name !== undefined && name !== null) updateFields.name = name;
      if (email !== undefined && email !== null) updateFields.email = email;
      if (department !== undefined && department !== null) updateFields.department = department;
      if (semester !== undefined && semester !== null) {
        const semesterInt = parseInt(semester);
        if (!isNaN(semesterInt)) {
          updateFields.semester = semesterInt;
        }
      }
      if (bio !== undefined) updateFields.bio = bio; // Allow null/empty bio

      console.log("Update fields prepared:", updateFields);

      // Update user basic information using raw SQL to avoid Prisma conflicts
      // Target the public.users table specifically (not auth.users)
      const updateQuery = `
        UPDATE public.users
        SET ${Object.keys(updateFields).map((key, index) => `"${key}" = $${index + 2}`).join(', ')}
        WHERE id = $1
        RETURNING id, name, email, department, semester, bio, profile_picture_url, cgpa
      `;

      const values = [userId, ...Object.values(updateFields)];
      const result = await prisma.$queryRawUnsafe(updateQuery, ...values);
      const updatedUser = result[0];

      console.log("User updated successfully:", updatedUser);

      // Handle courses update if provided
      if (courses && Array.isArray(courses)) {
        console.log("Updating courses:", courses);

        try {
          // Remove existing current courses
          const deleteResult = await prisma.user_courses.deleteMany({
            where: {
              user_id: userId,
              is_completed: false,
            },
          });
          console.log("Deleted existing courses:", deleteResult);

          // Add new courses - now expecting course codes
          for (const courseCode of courses) {
            if (!courseCode || typeof courseCode !== 'string') {
              console.warn("Skipping invalid course code:", courseCode);
              continue;
            }

            // Find course by course code
            let course = await prisma.courses.findFirst({
              where: { course_code: courseCode },
            });

            if (!course) {
              console.warn("Course not found with code:", courseCode);
              continue; // Skip if course doesn't exist
            }

            // Add user to course
            await prisma.user_courses.create({
              data: {
                user_id: userId,
                course_id: course.id,
                enrolled_semester: updatedUser.semester || 1,
                is_completed: false,
              },
            });
            console.log("Added user to course:", courseCode);
          }
        } catch (courseError) {
          console.error("Error updating courses:", courseError);
          // Don't throw here, just log the error and continue
        }
      }

      // Get updated profile with courses
      console.log("Getting updated profile...");
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error("Update user profile error - Full error:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  // Get all available courses for selection
  async getAllCourses() {
    try {
      const courses = await prisma.courses.findMany({
        select: {
          id: true,
          course_code: true,
          course_name: true,
          department: true,
          credit_hours: true,
          description: true,
          difficulty: true,
          course_type: true,
        },
        orderBy: [
          { department: 'asc' },
          { course_code: 'asc' }
        ]
      });

      return courses;
    } catch (error) {
      console.error("Get all courses error:", error);
      throw error;
    }
  }
}

module.exports = ProfileService;