const NotesService = require("../services/notesService");

class NotesController {
  constructor() {
    this.notesService = NotesService.getInstance();
  }

  // Upload a new note
  uploadNote = async (req, res) => {
    try {
      const { title, course, description, visibility } = req.body;
      const file = req.file;
      const userId = req.user.id;

      // Validation
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
          error: "MISSING_FILE",
        });
      }

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
          error: "MISSING_TITLE",
        });
      }

      if (!course) {
        return res.status(400).json({
          success: false,
          message: "Course is required",
          error: "MISSING_COURSE",
        });
      }

      // Upload note
      const result = await this.notesService.uploadNote({
        userId,
        title: title.trim(),
        course,
        description: description?.trim() || null,
        visibility: visibility || "public",
        file,
      });

      res.status(201).json({
        success: true,
        message: "Note uploaded successfully",
        data: result,
      });
    } catch (error) {
      console.error("Upload note error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload note",
        error: "UPLOAD_FAILED",
      });
    }
  };

  // Get all notes with filters
  getAllNotes = async (req, res) => {
    try {
      const {
        course,
        search,
        visibility = "public",
        limit = 20,
        offset = 0,
      } = req.query;

      const result = await this.notesService.getAllNotes({
        course,
        search,
        visibility,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: result.notes,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result.total > parseInt(offset) + parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get all notes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notes",
        error: "FETCH_FAILED",
      });
    }
  };

  // Get note by ID
  getNoteById = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Optional user for checking permissions

      const note = await this.notesService.getNoteById(id, userId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      console.error("Get note by ID error:", error);

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
          message: "You don't have permission to view this note",
          error: "ACCESS_DENIED",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch note",
        error: "FETCH_FAILED",
      });
    }
  };

  // Get notes by user
  getUserNotes = async (req, res) => {
    try {
      const { userId } = req.params;
      const { course, search, limit = 20, offset = 0 } = req.query;

      // Check if user is viewing their own notes or has permission
      const requestingUserId = req.user.id;
      const canViewPrivate = parseInt(userId) === requestingUserId;

      const result = await this.notesService.getUserNotes(userId, {
        course,
        search,
        canViewPrivate,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: result.notes,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result.total > parseInt(offset) + parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get user notes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user notes",
        error: "FETCH_FAILED",
      });
    }
  };

  // Update note
  updateNote = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, visibility } = req.body;
      const userId = req.user.id;

      // Validate visibility field
      if (
        visibility &&
        !["public", "private", "course_only"].includes(visibility)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid visibility value. Must be 'public', 'private', or 'course_only'",
          error: "INVALID_VISIBILITY",
        });
      }

      // Only pass the specific fields we want to update
      const updateData = {};
      if (title !== undefined) updateData.title = title?.trim();
      if (description !== undefined)
        updateData.description = description?.trim();
      if (visibility !== undefined) updateData.visibility = visibility;

      const updatedNote = await this.notesService.updateNote(
        id,
        userId,
        updateData
      );

      res.json({
        success: true,
        message: "Note updated successfully",
        data: updatedNote,
      });
    } catch (error) {
      console.error("Update note error:", error);

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
          message: "You don't have permission to update this note",
          error: "ACCESS_DENIED",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update note",
        error: "UPDATE_FAILED",
      });
    }
  };

  // Delete note
  deleteNote = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await this.notesService.deleteNote(id, userId);

      res.json({
        success: true,
        message: "Note deleted successfully",
      });
    } catch (error) {
      console.error("Delete note error:", error);

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
          message: "You don't have permission to delete this note",
          error: "ACCESS_DENIED",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete note",
        error: "DELETE_FAILED",
      });
    }
  };

  // Download note file
  downloadNote = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Optional user for checking permissions

      const { fileBuffer, fileName, mimeType } =
        await this.notesService.downloadNote(id, userId);

      // Increment download count
      await this.notesService.incrementDownloadCount(id);

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

  // Toggle like/unlike
  toggleLike = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.notesService.toggleLike(id, userId);

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

  // Get courses list
  getCourses = async (req, res) => {
    try {
      const courses = await this.notesService.getCourses();

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch courses",
        error: "FETCH_FAILED",
      });
    }
  };
}

module.exports = new NotesController();
