const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const reviewServices = {
  // Create a new review
  createReview: async (reviewData) => {
    try {
      const {
        user_id,
        course_id,
        difficulty_rating,
        workload_rating,
        review_text,
        semester_taken,
        year_taken,
        is_anonymous = false
      } = reviewData;

      // Check if user already has a review for this course
      const existingReview = await prisma.course_reviews.findUnique({
        where: {
          user_id_course_id: {
            user_id: user_id,
            course_id: course_id
          }
        }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this course');
      }

      // Create the review
      const newReview = await prisma.course_reviews.create({
        data: {
          user_id,
          course_id,
          difficulty_rating,
          workload_rating,
          review_text,
          semester_taken,
          year_taken,
          is_anonymous
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true
            }
          },
          courses: {
            select: {
              id: true,
              course_code: true,
              course_name: true
            }
          }
        }
      });

      return newReview;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Get all reviews for a specific course
  getCourseReviews: async (courseId) => {
    try {
      const reviews = await prisma.course_reviews.findMany({
        where: {
          course_id: parseInt(courseId)
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true,
              semester: true,
              profile_picture_url: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Filter out user info for anonymous reviews
      const processedReviews = reviews.map(review => ({
        ...review,
        users: review.is_anonymous ? null : review.users
      }));

      return processedReviews;
    } catch (error) {
      console.error('Error fetching course reviews:', error);
      throw error;
    }
  },

  // Get review statistics for a course
  getCourseReviewStats: async (courseId) => {
    try {
      const stats = await prisma.course_reviews.aggregate({
        where: {
          course_id: parseInt(courseId)
        },
        _avg: {
          difficulty_rating: true,
          workload_rating: true
        },
        _count: {
          id: true
        }
      });

      return {
        total_reviews: stats._count.id,
        average_difficulty: stats._avg.difficulty_rating ? parseFloat(stats._avg.difficulty_rating.toFixed(1)) : 0,
        average_workload: stats._avg.workload_rating ? parseFloat(stats._avg.workload_rating.toFixed(1)) : 0
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  },

  // Update review vote counts
  updateReviewVotes: async (reviewId, voteType) => {
    try {
      const updateData = voteType === 'up' 
        ? { up_votes: { increment: 1 } }
        : { down_votes: { increment: 1 } };

      const updatedReview = await prisma.course_reviews.update({
        where: {
          id: parseInt(reviewId)
        },
        data: updateData
      });

      return updatedReview;
    } catch (error) {
      console.error('Error updating review votes:', error);
      throw error;
    }
  },

  // Get user's review for a specific course
  getUserReview: async (userId, courseId) => {
    try {
      const review = await prisma.course_reviews.findUnique({
        where: {
          user_id_course_id: {
            user_id: parseInt(userId),
            course_id: parseInt(courseId)
          }
        },
        include: {
          courses: {
            select: {
              course_code: true,
              course_name: true
            }
          }
        }
      });

      return review;
    } catch (error) {
      console.error('Error fetching user review:', error);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId, userId) => {
    try {
      // First check if the review belongs to the user
      const review = await prisma.course_reviews.findFirst({
        where: {
          id: parseInt(reviewId),
          user_id: parseInt(userId)
        }
      });

      if (!review) {
        throw new Error('Review not found or unauthorized');
      }

      await prisma.course_reviews.delete({
        where: {
          id: parseInt(reviewId)
        }
      });

      return { message: 'Review deleted successfully' };
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // Update a review
  updateReview: async (reviewId, userId, reviewData) => {
    try {
      // First check if the review belongs to the user
      const review = await prisma.course_reviews.findFirst({
        where: {
          id: parseInt(reviewId),
          user_id: parseInt(userId)
        }
      });

      if (!review) {
        throw new Error('Review not found or unauthorized');
      }

      // Update the review
      const updatedReview = await prisma.course_reviews.update({
        where: {
          id: parseInt(reviewId)
        },
        data: {
          difficulty_rating: reviewData.difficulty_rating,
          workload_rating: reviewData.workload_rating,
          review_text: reviewData.review_text,
          semester_taken: reviewData.semester_taken,
          year_taken: reviewData.year_taken,
          is_anonymous: reviewData.is_anonymous
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true
            }
          },
          courses: {
            select: {
              id: true,
              course_code: true,
              course_name: true
            }
          }
        }
      });

      return updatedReview;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }
};

module.exports = reviewServices;
