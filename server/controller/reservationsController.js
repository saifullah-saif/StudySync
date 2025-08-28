const reservationsService = require("../services/reservationsService");

async function createReservation(req, res) {
  try {
    console.log("=== CREATE RESERVATION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("User:", req.user);

    const { room_id, start_time, end_time, purpose, selected_seats, room_capacity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      console.log("Authentication failed - no user ID");
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!room_id || !start_time || !end_time) {
      console.log("Missing required fields:", { room_id, start_time, end_time });
      return res.status(400).json({ success: false, message: "Room ID, start time, and end time are required" });
    }

    console.log("Creating reservation with:", {
      room_id,
      userId,
      start_time,
      end_time,
      purpose,
      selected_seats,
      room_capacity
    });

    const reservations = await reservationsService.createRoomReservation(
      room_id,
      userId,
      new Date(start_time),
      new Date(end_time),
      purpose,
      selected_seats || [],
      room_capacity || 0
    );

    console.log("Reservation created successfully:", reservations);
    return res.json({ success: true, data: reservations });
  } catch (err) {
    console.error("Error creating reservation:", err);
    console.error("Error stack:", err.stack);
    return res.status(400).json({ success: false, message: err.message || "Failed to create reservation" });
  }
}

async function getUserReservations(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const reservations = await reservationsService.getUserReservations(userId);
    return res.json({ success: true, data: reservations });
  } catch (err) {
    console.error("Error fetching user reservations:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch reservations" });
  }
}

async function cancelReservation(req, res) {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    await reservationsService.cancelReservation(reservationId, userId);
    return res.json({ success: true, message: "Reservation cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling reservation:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to cancel reservation" });
  }
}

async function updateRoomAvailability(req, res) {
  try {
    const result = await reservationsService.updateRoomAvailability();
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error updating room availability:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update room availability" });
  }
}

async function checkRoomAvailability(req, res) {
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

    const available = await reservationsService.checkRoomAvailability(
      parseInt(roomId),
      startTime,
      endTime
    );

    return res.json({
      success: true,
      available
    });
  } catch (err) {
    console.error("Error checking room availability:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to check room availability"
    });
  }
}

module.exports = {
  createReservation,
  getUserReservations,
  cancelReservation,
  updateRoomAvailability,
  checkRoomAvailability
};
