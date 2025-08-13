const express = require("express");
const router = express.Router();
const seatsController = require("../controller/seatsController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

// GET /api/seats/room/:roomId - Get all seats for a room
router.get("/room/:roomId", seatsController.getSeatsByRoom);

// GET /api/seats/:seatId - Get seat by ID
router.get("/:seatId", seatsController.getSeatById);

// POST /api/seats/:seatId/reserve - Create a reservation (protected)
router.post("/:seatId/reserve", verifyTokenFromCookie, seatsController.createReservation);

// DELETE /api/seats/reservations/:reservationId - Cancel a reservation (protected)
router.delete("/reservations/:reservationId", verifyTokenFromCookie, seatsController.cancelReservation);

// GET /api/seats/reservations/my - Get user's reservations (protected)
router.get("/reservations/my", verifyTokenFromCookie, seatsController.getUserReservations);

module.exports = router;
