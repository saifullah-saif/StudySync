const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

class NotesService {
  constructor() {
    if (NotesService.instance) {
      return NotesService.instance;
    }

    this.prisma = new PrismaClient();

    // Initialize Supabase only if credentials are provided
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    } else {
      console.warn(
        "Supabase credentials not found. File upload will not work."
      );
      this.supabase = null;
    }

    NotesService.instance = this;
  }

  static getInstance() {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  // Get file type from MIME type
  getFileTypeFromMime(mimeType) {
    switch (mimeType) {
      case "application/pdf":
        return "pdf";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "docx";
      case "text/plain":
        return "txt";
      default:
        throw new Error("Unsupported file type");
    }
  }

  // Get file extension from MIME type
  getFileExtension(mimeType) {
    switch (mimeType) {
      case "application/pdf":
        return ".pdf";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return ".docx";
      case "text/plain":
        return ".txt";
      default:
        throw new Error("Unsupported file type");
    }
  }

  // Upload file to Supabase Storage
  async uploadFileToStorage(file, fileName) {
    try {
      const { data, error } = await this.supabase.storage
        .from("study-sync-documents")
        .upload(`Notes/${fileName}`, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Failed to upload file to storage: ${error.message}`);
      }

      return data.path;
    } catch (error) {
      console.error("Upload to storage error:", error);
      throw error;
    }
  }

  async getFilePublicUrl(filePath) {
    try {
      const { data, error } = this.supabase.storage
        .from("study-sync-documents")
        .getPublicUrl(filePath);

      if (error) {
        console.error("Supabase get public URL error:", error);
        throw new Error(`Failed to get public URL for file: ${error.message}`);
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Get public URL error:", error);
      throw error;
    }
  }

  // Download file from Supabase Storage
  async downloadFileFromStorage(filePath) {
    try {
      const { data, error } = await this.supabase.storage
        .from("study-sync-documents")
        .download(filePath);

      if (error) {
        console.error("Supabase download error:", error);
        throw new Error(
          `Failed to download file from storage: ${error.message}`
        );
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      console.error("Download from storage error:", error);
      throw error;
    }
  }

  // Delete file from Supabase Storage
  async deleteFileFromStorage(filePath) {
    try {
      const { error } = await this.supabase.storage
        .from("study-sync-documents")
        .remove([filePath]);

      if (error) {
        console.error("Supabase delete error:", error);
        throw new Error(`Failed to delete file from storage: ${error.message}`);
      }
    } catch (error) {
      console.error("Delete from storage error:", error);
      throw error;
    }
  }

  // Upload note
  async uploadNote({ userId, title, course, description, visibility, file }) {
    try {
      // Check if Supabase is available
      if (!this.supabase) {
        throw new Error(
          "File upload is not available. Supabase configuration is missing."
        );
      }

      // Find course by course code
      const courseRecord = await this.prisma.courses.findUnique({
        where: { course_code: course },
      });

      if (!courseRecord) {
        throw new Error(`Course ${course} not found`);
      }

      // Generate unique file name
      const fileExtension = this.getFileExtension(file.mimetype);
      const uniqueFileName = `${title}-${uuidv4()}${fileExtension}`;

      // Upload file to Supabase Storage
      const filePath = await this.uploadFileToStorage(file, uniqueFileName);
      const fileUrl = await this.getFilePublicUrl(filePath);
      // Get file type for database
      const fileType = this.getFileTypeFromMime(file.mimetype);

      // Create note record in database
      const note = await this.prisma.notes.create({
        data: {
          user_id: userId,
          course_id: courseRecord.id,
          title,
          description,
          file_name: file.originalname,
          file_path: filePath,
          file_type: fileType,
          file_size_bytes: BigInt(file.size),
          file_url: fileUrl,
          visibility,
          tags: [], // Empty array for now, can be enhanced later
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          courses: {
            select: {
              id: true,
              course_code: true,
              course_name: true,
            },
          },
        },
      });

      // Convert BigInt to string for JSON serialization
      const serializedNote = {
        ...note,
        file_size_bytes: note.file_size_bytes.toString(),
      };

      return serializedNote;
    } catch (error) {
      console.error("Upload note service error:", error);
      throw error;
    }
  }

  // Get all notes with filters
  async getAllNotes({ userId, course, search, visibility, limit, offset }) {
    try {
      // Build the visibility filter based on user authentication and permissions
      let visibilityFilter;

      if (userId) {
        // For authenticated users: implement comprehensive filtering
        if (visibility && visibility !== "all") {
          // If a specific visibility is requested, filter by it (with permission checks)
          switch (visibility) {
            case "public":
              visibilityFilter = { visibility: "public" };
              break;
            case "private":
              // Only show private notes uploaded by the current user
              visibilityFilter = {
                AND: [{ visibility: "private" }, { user_id: userId }],
              };
              break;
            case "course_only":
              // Only show course_only notes for courses where user is enrolled
              visibilityFilter = {
                AND: [
                  { visibility: "course_only" },
                  {
                    courses: {
                      user_courses: {
                        some: {
                          user_id: userId,
                        },
                      },
                    },
                  },
                ],
              };
              break;
            default:
              // Default to public for invalid visibility values
              visibilityFilter = { visibility: "public" };
          }
        } else {
          // No specific visibility requested - show all notes user has permission to see
          visibilityFilter = {
            OR: [
              // 1. All public notes
              { visibility: "public" },
              // 2. Course-only notes for courses where user is enrolled
              {
                AND: [
                  { visibility: "course_only" },
                  {
                    courses: {
                      user_courses: {
                        some: {
                          user_id: userId,
                        },
                      },
                    },
                  },
                ],
              },
              // 3. Private notes uploaded by the current user
              {
                AND: [{ visibility: "private" }, { user_id: userId }],
              },
            ],
          };
        }
      } else {
        // For unauthenticated users: only show public notes
        if (visibility && visibility === "public") {
          visibilityFilter = { visibility: "public" };
        } else if (visibility && visibility !== "public") {
          // Non-authenticated users cannot access private or course_only notes
          visibilityFilter = { visibility: "public" };
        } else {
          // Default to public for unauthenticated users
          visibilityFilter = { visibility: "public" };
        }
      }

      // Build the complete where clause
      const where = {
        AND: [
          visibilityFilter,
          course
            ? {
                courses: {
                  course_code: course,
                },
              }
            : {},
          search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  {
                    users: { name: { contains: search, mode: "insensitive" } },
                  },
                ],
              }
            : {},
        ],
      };

      const [notes, total] = await Promise.all([
        this.prisma.notes.findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
            courses: {
              select: {
                id: true,
                course_code: true,
                course_name: true,
              },
            },
            note_interactions: {
              where: { interaction_type: "like" },
              select: { id: true },
            },
          },
          orderBy: { upload_date: "desc" },
          take: limit,
          skip: offset,
        }),
        this.prisma.notes.count({ where }),
      ]);

      // Add like count and convert BigInt
      const serializedNotes = notes.map((note) => ({
        ...note,
        file_size_bytes: note.file_size_bytes.toString(),
        like_count: note.note_interactions.length,
        note_interactions: undefined, // Remove the interaction details
      }));

      return {
        notes: serializedNotes,
        total,
      };
    } catch (error) {
      console.error("Get all notes service error:", error);
      throw error;
    }
  }

  // Get note by ID
  async getNoteById(id, userId = null) {
    try {
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(id) },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          courses: {
            select: {
              id: true,
              course_code: true,
              course_name: true,
            },
          },
          note_interactions: {
            where: { interaction_type: "like" },
            select: {
              id: true,
              user_id: true,
            },
          },
        },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Check visibility permissions
      if (
        note.visibility === "private" &&
        (!userId || note.user_id !== userId)
      ) {
        throw new Error("Access denied");
      }

      // Check if current user has liked the note
      const userLiked = userId
        ? note.note_interactions.some(
            (interaction) => interaction.user_id === userId
          )
        : false;

      const serializedNote = {
        ...note,
        file_size_bytes: note.file_size_bytes.toString(),
        like_count: note.note_interactions.length,
        user_liked: userLiked,
        note_interactions: undefined, // Remove the interaction details
      };

      return serializedNote;
    } catch (error) {
      console.error("Get note by ID service error:", error);
      throw error;
    }
  }

  // Get notes by user
  async getUserNotes(
    userId,
    { course, search, canViewPrivate, limit, offset }
  ) {
    try {
      const where = {
        AND: [
          { user_id: parseInt(userId) },
          !canViewPrivate ? { visibility: { not: "private" } } : {},
          course
            ? {
                courses: {
                  course_code: course,
                },
              }
            : {},
          search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      };

      const [notes, total] = await Promise.all([
        this.prisma.notes.findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
            courses: {
              select: {
                id: true,
                course_code: true,
                course_name: true,
              },
            },
            note_interactions: {
              where: { interaction_type: "like" },
              select: { id: true },
            },
          },
          orderBy: { upload_date: "desc" },
          take: limit,
          skip: offset,
        }),
        this.prisma.notes.count({ where }),
      ]);

      const serializedNotes = notes.map((note) => ({
        ...note,
        file_size_bytes: note.file_size_bytes.toString(),
        like_count: note.note_interactions.length,
        note_interactions: undefined,
      }));

      return {
        notes: serializedNotes,
        total,
      };
    } catch (error) {
      console.error("Get user notes service error:", error);
      throw error;
    }
  }

  // Update note
  async updateNote(id, userId, updateData) {
    try {
      const existingNote = await this.prisma.notes.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingNote) {
        throw new Error("Note not found");
      }

      if (existingNote.user_id !== userId) {
        throw new Error("Access denied");
      }

      const dataToUpdate = {};

      if (updateData.title !== undefined && updateData.title !== null) {
        dataToUpdate.title = updateData.title;
      }

      if (
        updateData.description !== undefined &&
        updateData.description !== null
      ) {
        dataToUpdate.description = updateData.description;
      }

      if (
        updateData.visibility !== undefined &&
        updateData.visibility !== null
      ) {
        dataToUpdate.visibility = updateData.visibility;
      }

      dataToUpdate.last_modified = new Date();

      const updatedNote = await this.prisma.notes.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          courses: {
            select: {
              id: true,
              course_code: true,
              course_name: true,
            },
          },
        },
      });

      return {
        ...updatedNote,
        file_size_bytes: updatedNote.file_size_bytes.toString(),
      };
    } catch (error) {
      console.error("Update note service error:", error);
      throw error;
    }
  }

  // Delete note
  async deleteNote(id, userId) {
    try {
      // First check if note exists and user has permission
      const existingNote = await this.prisma.notes.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingNote) {
        throw new Error("Note not found");
      }

      if (existingNote.user_id !== userId) {
        throw new Error("Access denied");
      }

      // Delete file from storage
      await this.deleteFileFromStorage(existingNote.file_path);

      // Delete note from database (cascade will handle related records)
      await this.prisma.notes.delete({
        where: { id: parseInt(id) },
      });

      return true;
    } catch (error) {
      console.error("Delete note service error:", error);
      throw error;
    }
  }

  // Download note
  async downloadNote(id, userId = null) {
    try {
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(id) },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Check visibility permissions
      if (
        note.visibility === "private" &&
        (!userId || note.user_id !== userId)
      ) {
        throw new Error("Access denied");
      }

      // Download file from storage
      const fileBuffer = await this.downloadFileFromStorage(note.file_path);

      // Determine MIME type
      let mimeType;
      switch (note.file_type) {
        case "pdf":
          mimeType = "application/pdf";
          break;
        case "docx":
          mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          break;
        case "txt":
          mimeType = "text/plain";
          break;
        default:
          mimeType = "application/octet-stream";
      }

      return {
        fileBuffer,
        fileName: note.file_name,
        mimeType,
      };
    } catch (error) {
      console.error("Download note service error:", error);
      throw error;
    }
  }

  // Increment download count
  async incrementDownloadCount(id) {
    try {
      await this.prisma.notes.update({
        where: { id: parseInt(id) },
        data: {
          download_count: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error("Increment download count error:", error);
      // Don't throw error for download count increment failure
    }
  }

  // Toggle like/unlike
  async toggleLike(id, userId) {
    try {
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(id) },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Check if user already liked the note
      const existingLike = await this.prisma.note_interactions.findUnique({
        where: {
          user_id_note_id_interaction_type: {
            user_id: userId,
            note_id: parseInt(id),
            interaction_type: "like",
          },
        },
      });

      let liked;
      if (existingLike) {
        // Unlike the note
        await this.prisma.note_interactions.delete({
          where: {
            user_id_note_id_interaction_type: {
              user_id: userId,
              note_id: parseInt(id),
              interaction_type: "like",
            },
          },
        });
        liked = false;
      } else {
        // Like the note
        await this.prisma.note_interactions.create({
          data: {
            user_id: userId,
            note_id: parseInt(id),
            interaction_type: "like",
          },
        });
        liked = true;
      }

      // Get updated like count
      const likeCount = await this.prisma.note_interactions.count({
        where: {
          note_id: parseInt(id),
          interaction_type: "like",
        },
      });

      return {
        liked,
        likeCount,
      };
    } catch (error) {
      console.error("Toggle like service error:", error);
      throw error;
    }
  }

  // Get courses list
  async getCourses() {
    try {
      const courses = await this.prisma.courses.findMany({
        select: {
          id: true,
          course_code: true,
          course_name: true,
          department: true,
        },
        orderBy: [{ department: "asc" }, { course_code: "asc" }],
      });

      return courses;
    } catch (error) {
      console.error("Get courses service error:", error);
      throw error;
    }
  }
}

module.exports = NotesService;
