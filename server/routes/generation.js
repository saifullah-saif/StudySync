const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  generateFlashcardsFromFile,
  getJobStatus,
  getUserJobs,
  cancelJob,
  getGenerationTemplates,
} = require("../controller/generationController");

const router = express.Router();

// All generation routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/generation/files/:documentId/flashcards
 * @desc Generate flashcards from an uploaded file
 * @access Private
 * @body {
 *   deckTitle?: string,
 *   cardType?: "basic" | "multiple_choice",
 *   targetDifficulty?: number (1-5),
 *   maxCards?: number (1-100),
 *   templateId?: number
 * }
 */
router.post("/files/:documentId/flashcards", generateFlashcardsFromFile);

/**
 * @route GET /api/generation/jobs/:jobId
 * @desc Get generation job status
 * @access Private
 */
router.get("/jobs/:jobId", getJobStatus);

/**
 * @route GET /api/generation/jobs
 * @desc Get user's generation jobs with pagination and filtering
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number,
 *   status?: "queued" | "processing" | "completed" | "failed",
 *   sortBy?: string,
 *   sortOrder?: "asc" | "desc"
 * }
 */
router.get("/jobs", getUserJobs);

/**
 * @route DELETE /api/generation/jobs/:jobId
 * @desc Cancel a generation job
 * @access Private
 */
router.delete("/jobs/:jobId", cancelJob);

/**
 * @route GET /api/generation/templates
 * @desc Get available generation templates
 * @access Private
 */
router.get("/templates", getGenerationTemplates);

module.exports = router;
