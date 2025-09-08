const libraryRoomsService = require("../services/libraryRoomsService");

async function listRooms(req, res) {
  try {
    const rooms = await libraryRoomsService.getAllLibraryRooms();
    return res.json({ success: true, data: rooms });
  } catch (err) {
    console.error("Error fetching library rooms:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch rooms" });
  }
}

async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await libraryRoomsService.getLibraryRoomById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    return res.json({ success: true, data: room });
  } catch (err) {
    console.error("Error fetching library room by id:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to fetch room" });
  }
}

module.exports = {
  listRooms,
  getRoomById,
};

