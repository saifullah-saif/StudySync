const reviewServices = require('../services/revServices');

const reviewController = {
  // Create a new review
  createReview: async (req, res) => {
    try {
      const {
        course_id,
        difficulty_rating,
        workload_rating,
        review_text,
        semester_taken,
        year_taken,
        is_anonymous
      } = req.body;

      // Validation
      if (!course_id || !difficulty_rating || !semester_taken || !year_taken) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: course_id, difficulty_rating, semester_taken, year_taken'
        });
      }

      if (difficulty_rating < 1 || difficulty_rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Difficulty rating must be between 1 and 5'
        });
      }

      if (workload_rating && (workload_rating < 1 || workload_rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Workload rating must be between 1 and 5'
        });
      }

      const reviewData = {
        user_id: req.user.id,
        course_id: parseInt(course_id),
        difficulty_rating: parseInt(difficulty_rating),
        workload_rating: workload_rating ? parseInt(workload_rating) : null,
        review_text: review_text || null,
        semester_taken,
        year_taken: parseInt(year_taken),
        is_anonymous: Boolean(is_anonymous)
      };

      const newReview = await reviewServices.createReview(reviewData);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: newReview
      });
    } catch (error) {
      console.error('Error in createReview controller:', error);
      
      if (error.message === 'You have already reviewed this course') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create review',
        error: error.message
      });
    }
  },

  // Get all reviews for a course
  getCourseReviews: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
      }

      const reviews = await reviewServices.getCourseReviews(courseId);
      const stats = await reviewServices.getCourseReviewStats(courseId);

      res.status(200).json({
        success: true,
        data: {
          reviews,
          stats
        }
      });
    } catch (error) {
      console.error('Error in getCourseReviews controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews',
        error: error.message
      });
    }
  },

  // Get user's review for a course
  getUserReview: async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
      }

      const review = await reviewServices.getUserReview(userId, courseId);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      console.error('Error in getUserReview controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user review',
        error: error.message
      });
    }
  },

  // Update review votes
  updateReviewVotes: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { voteType } = req.body;

      if (!reviewId || !voteType) {
        return res.status(400).json({
          success: false,
          message: 'Review ID and vote type are required'
        });
      }

      if (!['up', 'down'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Vote type must be "up" or "down"'
        });
      }

      const updatedReview = await reviewServices.updateReviewVotes(reviewId, voteType);

      res.status(200).json({
        success: true,
        message: 'Vote updated successfully',
        data: updatedReview
      });
    } catch (error) {
      console.error('Error in updateReviewVotes controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vote',
        error: error.message
      });
    }
  },

  // Delete a review
  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: 'Review ID is required'
        });
      }

      const result = await reviewServices.deleteReview(reviewId, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in deleteReview controller:', error);
      
      if (error.message === 'Review not found or unauthorized') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error.message
      });
    }
  }
};

module.exports = reviewController;
