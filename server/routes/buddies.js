const express = require("express");
const BuddyController = require("../controller/buddyController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

const router = express.Router();

// All buddy routes require authentication
router.use(verifyTokenFromCookie);

// GET /api/buddies - Get study buddies (peers or mentors)
// Query params: 
//   ?type=peers|mentors (default: peers)
//   ?search=query (optional: search by name or course code/name)
router.get("/", BuddyController.getBuddies);

module.exports = router;