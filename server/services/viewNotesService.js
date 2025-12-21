const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

class ViewNotesService {
  constructor() {
    if (ViewNotesService.instance) {
      return ViewNotesService.instance;
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
        "Supabase credentials not found. File operations will not work."
      );
      this.supabase = null;
    }

    ViewNotesService.instance = this;
  }

  static getInstance() {
    if (!ViewNotesService.instance) {
      ViewNotesService.instance = new ViewNotesService();
    }
    return ViewNotesService.instance;
  }

  // Get note with full details including comments and interactions
  async getNoteWithDetails(noteId, userId = null) {
    try {
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(noteId) },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              semester: true,
              profile_picture_url: true,
              bio: true,
            },
          },
          courses: {
            select: {
              id: true,
              course_code: true,
              course_name: true,
              department: true,
              credit_hours: true,
            },
          },
          note_interactions: {
            select: {
              id: true,
              user_id: true,
              interaction_type: true,
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

      // Process interactions
      const likes = note.note_interactions.filter(
        (interaction) => interaction.interaction_type === "like"
      );
      const upvotes = note.note_interactions.filter(
        (interaction) => interaction.interaction_type === "upvote"
      );
      const downvotes = note.note_interactions.filter(
        (interaction) => interaction.interaction_type === "downvote"
      );

      // Check user's interactions
      const userLiked = userId
        ? likes.some((interaction) => interaction.user_id === userId)
        : false;
      const userUpvoted = userId
        ? upvotes.some((interaction) => interaction.user_id === userId)
        : false;
      const userDownvoted = userId
        ? downvotes.some((interaction) => interaction.user_id === userId)
        : false;

      // Increment download count (optional, you can track this)
      await this.prisma.notes.update({
        where: { id: parseInt(noteId) },
        data: {
          download_count: {
            increment: 1,
          },
        },
      });

      const serializedNote = {
        ...note,
        file_size_bytes: note.file_size_bytes?.toString() || "0",
        like_count: likes.length,
        is_liked_by_user: userLiked,
        upvote_count: upvotes.length,
        downvote_count: downvotes.length,
        is_upvoted_by_user: userUpvoted,
        is_downvoted_by_user: userDownvoted,
        note_interactions: undefined, // Remove the interaction details from response
      };

      return serializedNote;
    } catch (error) {
      console.error("Get note with details service error:", error);
      throw error;
    }
  }

  // Get comments for a note with nested replies
  async getNoteComments(noteId) {
    try {
      const comments = await this.prisma.note_comments.findMany({
        where: {
          note_id: parseInt(noteId),
          parent_comment_id: null, // Only top-level comments
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true,
              profile_picture_url: true,
            },
          },
          other_note_comments: {
            // Get replies
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  department: true,
                  profile_picture_url: true,
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Format the response to match the expected structure
      const formattedComments = comments.map((comment) => ({
        ...comment,
        replies: comment.other_note_comments,
        other_note_comments: undefined,
      }));

      return formattedComments;
    } catch (error) {
      console.error("Get note comments service error:", error);
      throw error;
    }
  }

  // Add a comment to a note
  async addComment({ noteId, userId, commentText, parentCommentId = null }) {
    try {
      // Check if note exists
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(noteId) },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Create the comment
      const newComment = await this.prisma.note_comments.create({
        data: {
          note_id: parseInt(noteId),
          user_id: userId,
          comment_text: commentText,
          parent_comment_id: parentCommentId ? parseInt(parentCommentId) : null,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              department: true,
              profile_picture_url: true,
            },
          },
        },
      });

      return newComment;
    } catch (error) {
      console.error("Add comment service error:", error);
      throw error;
    }
  }

  // Toggle like for a note
  async toggleLike(noteId, userId) {
    try {
      // Check if note exists
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(noteId) },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Check if user has already liked this note
      const existingLike = await this.prisma.note_interactions.findUnique({
        where: {
          user_id_note_id_interaction_type: {
            user_id: userId,
            note_id: parseInt(noteId),
            interaction_type: "like",
          },
        },
      });

      let liked;
      if (existingLike) {
        // Remove like
        await this.prisma.note_interactions.delete({
          where: {
            id: existingLike.id,
          },
        });
        liked = false;
      } else {
        // Add like
        await this.prisma.note_interactions.create({
          data: {
            user_id: userId,
            note_id: parseInt(noteId),
            interaction_type: "like",
          },
        });
        liked = true;
      }

      // Get updated like count
      const likeCount = await this.prisma.note_interactions.count({
        where: {
          note_id: parseInt(noteId),
          interaction_type: "like",
        },
      });

      return { liked, likeCount };
    } catch (error) {
      console.error("Toggle like service error:", error);
      throw error;
    }
  }

  // Toggle vote (upvote/downvote) for a note
  async toggleVote(noteId, userId, voteType) {
    try {
      // Check if note exists
      const note = await this.prisma.notes.findUnique({
        where: { id: parseInt(noteId) },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      const interactionType = voteType; // 'upvote' or 'downvote'
      const oppositeType = voteType === "upvote" ? "downvote" : "upvote";

      // Check existing vote
      const existingVote = await this.prisma.note_interactions.findFirst({
        where: {
          user_id: userId,
          note_id: parseInt(noteId),
          interaction_type: {
            in: ["upvote", "downvote"],
          },
        },
      });

      let action;
      let userVote = null;

      if (existingVote) {
        if (existingVote.interaction_type === interactionType) {
          // Remove the same vote
          await this.prisma.note_interactions.delete({
            where: { id: existingVote.id },
          });
          action = "removed";
          userVote = null;
        } else {
          // Update to opposite vote
          await this.prisma.note_interactions.update({
            where: { id: existingVote.id },
            data: { interaction_type: interactionType },
          });
          action = "updated";
          userVote = interactionType;
        }
      } else {
        // Create new vote
        await this.prisma.note_interactions.create({
          data: {
            user_id: userId,
            note_id: parseInt(noteId),
            interaction_type: interactionType,
          },
        });
        action = "added";
        userVote = interactionType;
      }

      // Get updated vote counts
      const upvotes = await this.prisma.note_interactions.count({
        where: {
          note_id: parseInt(noteId),
          interaction_type: "upvote",
        },
      });

      const downvotes = await this.prisma.note_interactions.count({
        where: {
          note_id: parseInt(noteId),
          interaction_type: "downvote",
        },
      });

      return { action, upvotes, downvotes, userVote };
    } catch (error) {
      console.error("Toggle vote service error:", error);
      throw error;
    }
  }
}

module.exports = ViewNotesService;
