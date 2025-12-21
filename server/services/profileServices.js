const { PrismaClient } = require("@prisma/client");
const FileUploadService = require("./fileUploadService");

const prisma = new PrismaClient();
const fileUploadService = FileUploadService.getInstance();

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

      // Get previous courses (completed)
      const previousCourses = await prisma.user_courses.findMany({
        where: {
          user_id: userId,
          is_completed: true,
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

      // Format previous courses - return course codes
      const previousCourseCodes = previousCourses.map((uc) => uc.courses.course_code);

      // Format completed courses with reviews - use course codes
      const completedCourses = completedCoursesWithReviews.map((review) => ({
        name: review.courses.course_code,
        rating: review.difficulty_rating,
        review: review.review_text || "No review provided",
      }));

      return {
        ...user,
        courses,
        previousCourses: previousCourseCodes,
        completedCourses,
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }

  // Update user profile with optional profile picture
  async updateUserProfile(userId, updateData, profilePictureFile = null) {
    try {
      const { name, email, department, semester, bio, courses, previousCourses } = updateData;

      // Validate userId
      if (!userId || typeof userId !== 'number') {
        throw new Error(`Invalid user ID: ${userId}`);
      }

      // Check if user exists first
      const existingUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, email: true, profile_picture_url: true }
      });

      if (!existingUser) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      // Handle profile picture upload if provided
      let profilePictureUrl = null;
      if (profilePictureFile) {
        try {
          // Upload new profile picture
          const uploadResult = await fileUploadService.uploadProfilePicture(userId, profilePictureFile);
          profilePictureUrl = uploadResult.publicUrl;

          // Delete old profile picture if it exists
          if (existingUser.profile_picture_url) {
            await fileUploadService.deleteProfilePicture(existingUser.profile_picture_url);
          }
        } catch (uploadError) {
          console.error('Profile picture upload failed:', uploadError);
          throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
        }
      }

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
      if (profilePictureUrl) updateFields.profile_picture_url = profilePictureUrl;

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
        const result = await prisma.$queryRawUnsafe(updateQuery, ...values);
        updatedUser = result[0];
      } else {
        // No basic profile fields to update, just get current user data
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

      // Handle current courses update if provided
      if (courses && Array.isArray(courses)) {
        await this.updateCoursesForUser(userId, courses, false, updatedUser.semester);
      }

      // Handle previous courses update if provided
      if (previousCourses && Array.isArray(previousCourses)) {
        await this.updateCoursesForUser(userId, previousCourses, true, updatedUser.semester);
      }

      // Get updated profile with courses
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error("Update user profile error:", error.message);
      throw error;
    }
  }

  // Helper method to update courses for a user
  async updateCoursesForUser(userId, courseList, isCompleted, userSemester) {
    try {
      // Use a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Remove existing courses of the specified type
        await tx.user_courses.deleteMany({
          where: {
            user_id: userId,
            is_completed: isCompleted,
          },
        });

        // Pre-fetch all courses to avoid transaction timeout issues
        const allAvailableCourses = await tx.courses.findMany({
          select: { id: true, course_code: true, course_name: true }
        });
        
        for (const courseCode of courseList) {
          if (!courseCode || typeof courseCode !== 'string') {
            continue;
          }

          // Find course from pre-fetched list (case-insensitive)
          const course = allAvailableCourses.find(c => 
            c.course_code.toLowerCase() === courseCode.toLowerCase()
          );

          if (!course) {
            console.warn("Course not found with code:", courseCode);
            continue; // Skip if course doesn't exist
          }

          // Check if the user is already enrolled in this course for this semester
          const existingEnrollment = await tx.user_courses.findFirst({
            where: {
              user_id: userId,
              course_id: course.id,
              enrolled_semester: userSemester || 1,
              is_completed: isCompleted,
            }
          });

          if (!existingEnrollment) {
            // Add user to course
            await tx.user_courses.create({
              data: {
                user_id: userId,
                course_id: course.id,
                enrolled_semester: userSemester || 1,
                is_completed: isCompleted,
              },
            });
          }
        }
      }, {
        maxWait: 10000, // 10 seconds
        timeout: 20000, // 20 seconds
      });
    } catch (courseError) {
      console.error(`Error updating ${isCompleted ? 'previous' : 'current'} courses:`, courseError.message);
      throw courseError;
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