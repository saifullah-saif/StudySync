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

// POST /api/buddies/connections - Create a new connection request
// Body: { addresseeId: number, requestType: "peer" | "mentor" }
router.post("/connections", BuddyController.createConnection);

// GET /api/buddies/connections - Get pending connection requests
router.get("/connections", BuddyController.getPendingConnections);

// GET /api/buddies/connections/accepted - Get accepted connections
router.get("/connections/accepted", BuddyController.getAcceptedConnections);

// GET /api/buddies/invitations - Get pending invitations (alias for connections)
router.get("/invitations", BuddyController.getPendingInvitations);

// PUT /api/buddies/invitations/:invitationId/respond - Respond to invitation
// Body: { response: "accepted" | "rejected" }
router.put("/invitations/:invitationId/respond", BuddyController.respondToInvitation);

// PUT /api/buddies/connections/:connectionId - Update connection status
// Body: { status: "accepted" | "rejected" }
router.put("/connections/:connectionId", BuddyController.updateConnectionStatus);

module.exports = router;