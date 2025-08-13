const express = require("express");
const router = express.Router();
const libraryRoomsController = require("../controller/libraryRoomsController");

// GET /api/library-rooms


router.get("/", libraryRoomsController.listRooms);

// GET /api/library-rooms/:id
router.get("/:id", libraryRoomsController.getRoomById);

module.exports = router;

