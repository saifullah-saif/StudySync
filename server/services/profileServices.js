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

      // Update user basic information
      let updatedUser;
      
      if (Object.keys(updateFields).length > 0) {
        // Update user basic information using raw SQL to avoid Prisma conflicts
        // Target the public.users table specifically (not auth.users)
        const updateQuery = `
          UPDATE public.users
          SET ${Object.keys(updateFields).map((key, index) => `"${key}" = $${index + 2}`).join(', ')}
          WHERE id = $1
          RETURNING id, name, email, department, semester, bio, profile_picture_url, cgpa
        `;

        const values = [userId, ...Object.values(updateFields)];
        console.log("Executing update query:", updateQuery);
        console.log("With values:", values);
        const result = await prisma.$queryRawUnsafe(updateQuery, ...values);
        updatedUser = result[0];
      } else {
        // No basic profile fields to update, just get current user data
        console.log("No basic fields to update, getting current user data");
        updatedUser = await prisma.users.findUnique({
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
      }

      console.log("User updated successfully:", updatedUser);

      // Handle courses update if provided
      if (courses && Array.isArray(courses)) {
        console.log("Updating courses:", courses);
        console.log("Number of courses to update:", courses.length);

        try {
          // Use a transaction to ensure data consistency
          await prisma.$transaction(async (tx) => {
            console.log("Starting course update transaction");
            
            // Remove existing current courses
            const deleteResult = await tx.user_courses.deleteMany({
              where: {
                user_id: userId,
                is_completed: false,
              },
            });
            console.log("Deleted existing courses:", deleteResult);

            // Add new courses - now expecting course codes
            const addedCourses = [];
            
            // Pre-fetch all courses to avoid transaction timeout issues
            const allAvailableCourses = await tx.courses.findMany({
              select: { id: true, course_code: true, course_name: true }
            });
            console.log("Available courses in transaction:", allAvailableCourses.length);
            
            for (const courseCode of courses) {
              if (!courseCode || typeof courseCode !== 'string') {
                console.warn("Skipping invalid course code:", courseCode);
                continue;
              }

              console.log("Processing course with code:", courseCode);

              // Find course from pre-fetched list (case-insensitive)
              const course = allAvailableCourses.find(c => 
                c.course_code.toLowerCase() === courseCode.toLowerCase()
              );

              if (!course) {
                console.warn("Course not found with code:", courseCode);
                console.log("Available course codes:", allAvailableCourses.map(c => c.course_code));
                continue; // Skip if course doesn't exist
              }

              console.log("Found course:", { id: course.id, code: course.course_code, name: course.course_name });

              // Check if the user is already enrolled in this course for this semester
              const existingEnrollment = await tx.user_courses.findFirst({
                where: {
                  user_id: userId,
                  course_id: course.id,
                  enrolled_semester: updatedUser.semester || 1,
                }
              });

              if (existingEnrollment) {
                console.log("User already enrolled in course:", courseCode, "- updating completion status");
                // Update the existing enrollment to not completed
                await tx.user_courses.update({
                  where: { id: existingEnrollment.id },
                  data: { is_completed: false }
                });
                addedCourses.push(courseCode);
              } else {
                // Add user to course
                const newEnrollment = await tx.user_courses.create({
                  data: {
                    user_id: userId,
                    course_id: course.id,
                    enrolled_semester: updatedUser.semester || 1,
                    is_completed: false,
                  },
                });
                console.log("Added user to course:", courseCode, "- enrollment ID:", newEnrollment.id);
                addedCourses.push(courseCode);
              }
            }

            console.log("Successfully processed courses:", addedCourses);
            console.log("Course update transaction completed");
          }, {
            maxWait: 10000, // 10 seconds
            timeout: 20000, // 20 seconds
          });

          console.log("Courses updated successfully in transaction");
        } catch (courseError) {
          console.error("Error updating courses:", courseError);
          console.error("Course error details:", courseError.message);
          console.error("Course error stack:", courseError.stack);
          // Don't throw here to avoid breaking the profile update
          // But we could add a flag to indicate partial success
        }
      } else {
        console.log("No courses provided or courses is not an array:", { courses, type: typeof courses });
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