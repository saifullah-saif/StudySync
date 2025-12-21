const express = require('express');
const router = express.Router();
const reviewController = require('../controller/revController');
const { verifyTokenFromCookie } = require('../middleware/jwtCookieMiddleware');

// Create a new review (requires auth)
router.post('/', verifyTokenFromCookie, reviewController.createReview);

// Get all reviews for a specific course (public)
router.get('/course/:courseId', reviewController.getCourseReviews);

// Get user's review for a specific course (requires auth)
router.get('/user/course/:courseId', verifyTokenFromCookie, reviewController.getUserReview);

// Update review votes (requires auth)
router.patch('/:reviewId/vote', verifyTokenFromCookie, reviewController.updateReviewVotes);

// Delete a review (requires auth)
router.delete('/:reviewId', verifyTokenFromCookie, reviewController.deleteReview);

module.exports = router;
