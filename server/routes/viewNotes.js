const express = require("express");
const ViewNotesController = require("../controller/viewNotesController");
const {
  verifyTokenFromCookie,
  optionalVerifyTokenFromCookie,
} = require("../middleware/jwtCookieMiddleware");

const router = express.Router();

// Routes for viewing notes with extended functionality
router.get(
  "/:id",
  optionalVerifyTokenFromCookie,
  ViewNotesController.getNoteDetails
);
router.get("/:id/comments", ViewNotesController.getNoteComments);
router.post(
  "/:id/comments",
  verifyTokenFromCookie,
  ViewNotesController.addComment
);
router.post("/:id/like", verifyTokenFromCookie, ViewNotesController.toggleLike);
router.post("/:id/vote", verifyTokenFromCookie, ViewNotesController.toggleVote);
router.get(
  "/:id/download",
  optionalVerifyTokenFromCookie,
  ViewNotesController.downloadNote
);

module.exports = router;
