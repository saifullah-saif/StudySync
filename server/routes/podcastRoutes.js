/**
 * Podcast API Routes
 * Handles podcast generation, retrieval, and management
 */

const express = require("express");
const router = express.Router();
const podcastGenerationService = require("../services/podcastGenerationService");

/**
 * POST /api/podcasts
 * Create a new podcast (status: pending)
 */
router.post("/", async (req, res) => {
  try {
    const { text, title, fileId, lang, userId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text content is required",
      });
    }

    const result = await podcastGenerationService.createPodcast(userId, text, {
      title,
      fileId,
      lang,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Podcast creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/podcasts
 * Get all podcasts for a user
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    const result = await podcastGenerationService.getUserPodcasts(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get podcasts error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/podcasts/file/:fileId
 * Check if a podcast exists for a specific file
 */
router.get("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await podcastGenerationService.getPodcastByFileId(fileId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get podcast by file error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/podcasts/:id
 * Get a specific podcast by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await podcastGenerationService.getPodcast(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get podcast error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * POST /api/podcasts/:id/retry
 * Retry failed podcast generation
 */
router.post("/:id/retry", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await podcastGenerationService.retryPodcast(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Retry podcast error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * DELETE /api/podcasts/:id
 * Delete a podcast
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await podcastGenerationService.deletePodcast(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Delete podcast error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;
