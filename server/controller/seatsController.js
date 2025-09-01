const seatsService = require("../services/seatsService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getSeatsByRoom(req, res) {
  try {
    const { roomId } = req.params;
    const seats = await seatsService.getSeatsByRoomId(roomId);
    return res.json({ success: true, data: seats });
  } catch (err) {
    console.error("Error fetching seats:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch seats" });
  }
}

async function getSeatById(req, res) {
  try {
    const { seatId } = req.params;
    console.log("Getting seat by id:", seatId);
    const seat = await seatsService.getSeatById(seatId);
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }
    return res.json({ success: true, data: seat });
  } catch (err) {
    console.error("Error fetching seat:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch seat" });
  }
}

async function createReservation(req, res) {
  try {
    const { seatId } = req.params;
    const { startTime, endTime, purpose } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Start time and end time are required" });
    }

    const reservation = await seatsService.createSeatReservation(
      seatId, 
      userId, 
      new Date(startTime), 
      new Date(endTime), 
      purpose
    );

    return res.json({ success: true, data: reservation });
  } catch (err) {
    console.error("Error creating reservation:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create reservation" });
  }
}

async function cancelReservation(req, res) {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    await seatsService.cancelSeatReservation(reservationId, userId);
    return res.json({ success: true, message: "Reservation cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling reservation:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to cancel reservation" });
  }
}

async function getUserReservations(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const reservations = await seatsService.getUserReservations(userId);
    return res.json({ success: true, data: reservations });
  } catch (err) {
    console.error("Error fetching user reservations:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch reservations" });
  }
}

async function getBookedSeats(req, res) {
  try {
    const { roomId } = req.params;
    const { start_time, end_time } = req.query;

    if (!roomId || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "Room ID, start time, and end time are required"
      });
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    // Find all reservations that overlap with the requested time period
    const bookedSeats = await prisma.reservations.findMany({
      where: {
        room_id: parseInt(roomId),
        seat_id: {
          not: null // Only seat reservations
        },
        status: {
          in: ['reserved', 'occupied']
        },
        OR: [
          {
            start_time: {
              lte: startTime
            },
            end_time: {
              gt: startTime
            }
          },
          {
            start_time: {
              lt: endTime
            },
            end_time: {
              gte: endTime
            }
          },
          {
            start_time: {
              gte: startTime
            },
            end_time: {
              lte: endTime
            }
          }
        ]
      },
      include: {
        seats: true
      }
    });

    // Extract seat numbers
    const bookedSeatNumbers = bookedSeats.map(reservation =>
      reservation.seats?.seat_number
    ).filter(Boolean);

    return res.json({
      success: true,
      bookedSeats: bookedSeatNumbers
    });
  } catch (err) {
    console.error("Error fetching booked seats:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booked seats"
    });
  }
}

module.exports = {
  getSeatsByRoom,
  getSeatById,
  createReservation,
  cancelReservation,
  getUserReservations,
  getBookedSeats
};
