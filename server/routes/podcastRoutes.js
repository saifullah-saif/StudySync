const express = require("express");
const router = express.Router();
const podcastController = require("../controller/podcastController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

// All podcast routes require authentication
router.use(verifyTokenFromCookie);

// GET /api/podcasts - Get all podcasts for a user
router.get("/", podcastController.getUserPodcasts);

// POST /api/podcasts - Save a new podcast
router.post("/", podcastController.savePodcast);

// GET /api/podcasts/:id - Get a specific podcast
router.get("/:id", podcastController.getPodcastById);

// DELETE /api/podcasts/:id - Delete a podcast
router.delete("/:id", podcastController.deletePodcast);

module.exports = router;
