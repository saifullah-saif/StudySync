const ViewNotesService = require("../services/viewNotesService");

class ViewNotesController {
  constructor() {
    this.viewNotesService = ViewNotesService.getInstance();
  }

  // Get note details with comments and interactions
  getNoteDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Optional user for checking permissions and interactions

      const noteDetails = await this.viewNotesService.getNoteWithDetails(
        id,
        userId
      );

      if (!noteDetails) {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: noteDetails,
      });
    } catch (error) {
      console.error("Get note details error:", error);

      if (error.message === "Note not found") {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          error: "ACCESS_DENIED",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch note details",
        error: "FETCH_FAILED",
      });
    }
  };

  // Get comments for a note
  getNoteComments = async (req, res) => {
    try {
      const { id } = req.params;

      const comments = await this.viewNotesService.getNoteComments(id);

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      console.error("Get note comments error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch comments",
        error: "FETCH_FAILED",
      });
    }
  };

  // Add a comment to a note
  addComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { comment_text, parent_comment_id } = req.body;
      const userId = req.user.id;

      // Validation
      if (!comment_text || !comment_text.trim()) {
        return res.status(400).json({
          success: false,
          message: "Comment text is required",
          error: "MISSING_COMMENT",
        });
      }

      const newComment = await this.viewNotesService.addComment({
        noteId: id,
        userId,
        commentText: comment_text.trim(),
        parentCommentId: parent_comment_id || null,
      });

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: newComment,
      });
    } catch (error) {
      console.error("Add comment error:", error);

      if (error.message === "Note not found") {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to add comment",
        error: "COMMENT_FAILED",
      });
    }
  };

  // Toggle like for a note
  toggleLike = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.viewNotesService.toggleLike(id, userId);

      res.json({
        success: true,
        message: result.liked ? "Note liked" : "Note unliked",
        data: {
          liked: result.liked,
          likeCount: result.likeCount,
        },
      });
    } catch (error) {
      console.error("Toggle like error:", error);

      if (error.message === "Note not found") {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to toggle like",
        error: "LIKE_FAILED",
      });
    }
  };

  // Toggle vote (upvote/downvote) for a note
  toggleVote = async (req, res) => {
    try {
      const { id } = req.params;
      const { voteType } = req.body; // 'upvote' or 'downvote'
      const userId = req.user.id;

      // Validation
      if (!voteType || !["upvote", "downvote"].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vote type. Must be 'upvote' or 'downvote'",
          error: "INVALID_VOTE_TYPE",
        });
      }

      const result = await this.viewNotesService.toggleVote(
        id,
        userId,
        voteType
      );

      res.json({
        success: true,
        message: `Vote ${result.action}`,
        data: {
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: result.userVote, // null, 'upvote', or 'downvote'
        },
      });
    } catch (error) {
      console.error("Toggle vote error:", error);

      if (error.message === "Note not found") {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to toggle vote",
        error: "VOTE_FAILED",
      });
    }
  };

  // Download note file
  downloadNote = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Optional user for checking permissions

      const { fileBuffer, fileName, mimeType } =
        await this.viewNotesService.downloadNote(id, userId);

      // Set headers for file download
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", fileBuffer.length);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Download note error:", error);

      if (error.message === "Note not found") {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to download this note",
          error: "ACCESS_DENIED",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to download note",
        error: "DOWNLOAD_FAILED",
      });
    }
  };
}

module.exports = new ViewNotesController();
