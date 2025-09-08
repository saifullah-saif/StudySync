const express = require("express");
const router = express.Router();
const reservationsController = require("../controller/reservationsController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

// POST /api/reservations - Create a reservation (protected)
router.post("/", verifyTokenFromCookie, reservationsController.createReservation);

// GET /api/reservations/my - Get user's reservations (protected)
router.get("/my", verifyTokenFromCookie, reservationsController.getUserReservations);

// DELETE /api/reservations/:reservationId - Cancel a reservation (protected)
router.delete("/:reservationId", verifyTokenFromCookie, reservationsController.cancelReservation);

// POST /api/reservations/update-availability - Update room availability (can be called by cron job)
router.post("/update-availability", reservationsController.updateRoomAvailability);

// GET /api/reservations/room/:roomId/check-availability - Check room availability for specific time period
router.get("/room/:roomId/check-availability", reservationsController.checkRoomAvailability);

module.exports = router;
