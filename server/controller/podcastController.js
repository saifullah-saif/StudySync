const prisma = require("../lib/prismaClient");

/**
 * Get all podcasts for a user
 * GET /api/podcasts
 * Requires authentication - uses req.user.id from JWT middleware
 */
const getUserPodcasts = async (req, res) => {
  try {
    console.log("📻 getUserPodcasts called");
    console.log("🔐 Authenticated user:", req.user);

    // Get user ID from authenticated session (set by JWT middleware)
    const userId = req.user?.id || req.user?.user_id;

    if (!userId) {
      console.error("❌ No user ID found in authenticated request");
      console.error("req.user:", req.user);
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    console.log(`📻 Fetching podcasts for authenticated user: ${userId}`);

    // Fetch podcasts from audio_content table
    const podcasts = await prisma.audio_content.findMany({
      where: {
        user_id: parseInt(userId),
      },
      orderBy: {
        generated_at: "desc", // Newest first
      },
      select: {
        id: true,
        title: true,
        audio_file_path: true,
        duration_seconds: true,
        generated_at: true,
        tts_model_version: true,
        play_count: true,
        note_id: true,
        notes: {
          select: {
            file_path: true, // Contains the podcast text or episodeId
            description: true,
          },
        },
      },
    });

    console.log(`✅ Found ${podcasts.length} podcasts for user ${userId}`);
    console.log("📦 Podcasts data:", JSON.stringify(podcasts, null, 2));

    // Transform to expected format
    const episodes = podcasts.map((podcast) => ({
      id: podcast.id,
      episodeId: podcast.audio_file_path || `episode_${podcast.id}`,
      title: podcast.title,
      description:
        podcast.notes?.description || `Generated podcast: ${podcast.title}`,
      duration: podcast.duration_seconds || 0,
      createdAt:
        podcast.generated_at?.toISOString() || new Date().toISOString(),
      sourceType: "ai-generated", // Can be enhanced later
      coverGradient: "from-blue-500 to-purple-600", // Default gradient
      fullText: podcast.notes?.file_path || podcast.audio_file_path, // Store episode ID for TTS retrieval
      audioUrl: `/api/podcasts/download/${
        podcast.audio_file_path || podcast.id
      }`,
    }));

    return res.json({
      success: true,
      episodes,
    });
  } catch (error) {
    console.error("❌ Error fetching podcasts:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch podcasts",
    });
  }
};

/**
 * Save a new podcast
 * POST /api/podcasts
 * Requires authentication - uses req.user.id from JWT middleware
 */
const savePodcast = async (req, res) => {
  try {
    console.log(
      "🎙️ savePodcast called - Request body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("🔐 Authenticated user:", req.user);

    // Get user ID from authenticated session
    const authenticatedUserId = req.user?.id || req.user?.user_id;

    if (!authenticatedUserId) {
      console.error("❌ No user ID found in authenticated request");
      console.error("req.user:", req.user);
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const {
      userId, // Legacy - will be ignored in favor of authenticated user
      episodeId,
      title,
      fullText,
      duration,
      wordCount,
      sourceFileId,
      sourceType,
    } = req.body;

    console.log("📋 Parsed request data:", {
      episodeId,
      title,
      fullTextLength: fullText?.length,
      duration,
      sourceFileId,
    });

    if (!title) {
      console.error("❌ Title is missing");
      return res.status(400).json({
        success: false,
        error: "title is required",
      });
    }

    // Always use authenticated user ID for security
    const userIdToUse = authenticatedUserId;

    console.log(
      `💾 Saving podcast for authenticated user ${userIdToUse}: ${title}`
    );

    // First, create a note to store the full text content
    let noteId = sourceFileId ? parseInt(sourceFileId) : null;

    if (fullText && !noteId) {
      // Create a new note to store the podcast text
      const note = await prisma.notes.create({
        data: {
          user_id: parseInt(userIdToUse),
          title: `${title} (Podcast Text)`,
          description: `Full text content for podcast: ${title}`,
          file_name: `podcast_${episodeId || Date.now()}.txt`,
          file_path: episodeId || `podcast_${Date.now()}`,
          file_type: "txt", // Must use enum value: pdf, docx, or txt
          file_size_bytes: BigInt(fullText.length),
          visibility: "private",
          tags: ["podcast", "ai-generated"],
          is_processed_by_ai: true,
        },
      });
      noteId = note.id;
      console.log(`📝 Created note ${noteId} to store podcast text`);
    }

    // Create podcast entry in audio_content table
    console.log("📝 Creating audio_content record...");
    const podcast = await prisma.audio_content.create({
      data: {
        user_id: parseInt(userIdToUse),
        title: title,
        audio_file_path: episodeId || `episode_${Date.now()}`, // Store episodeId here
        duration_seconds: duration || 0,
        file_size_bytes: BigInt(fullText?.length || 0),
        tts_model_version: "web-speech-api-v1",
        generated_at: new Date(),
        play_count: 0,
        note_id: noteId,
      },
    });

    console.log(
      `✅ ✅ ✅ Podcast PERSISTED to database with ID: ${podcast.id}`
    );
    console.log("📦 Saved podcast data:", {
      id: podcast.id,
      user_id: podcast.user_id,
      title: podcast.title,
      episodeId: podcast.audio_file_path,
      noteId: noteId,
    });

    return res.json({
      success: true,
      id: podcast.id,
      episodeId: podcast.audio_file_path,
      noteId: noteId,
      message: "Podcast saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving podcast:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to save podcast",
    });
  }
};

/**
 * Get a specific podcast by ID
 * GET /api/podcasts/:id
 */
const getPodcastById = async (req, res) => {
  try {
    const { id } = req.params;

    const podcast = await prisma.audio_content.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!podcast) {
      return res.status(404).json({
        success: false,
        error: "Podcast not found",
      });
    }

    return res.json({
      success: true,
      podcast: {
        id: podcast.id,
        episodeId: podcast.audio_file_path,
        title: podcast.title,
        duration: podcast.duration_seconds,
        createdAt: podcast.generated_at,
        playCount: podcast.play_count,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching podcast:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch podcast",
    });
  }
};

/**
 * Delete a podcast
 * DELETE /api/podcasts/:id
 */
const deletePodcast = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.audio_content.delete({
      where: {
        id: parseInt(id),
      },
    });

    console.log(`🗑️ Deleted podcast: ${id}`);

    return res.json({
      success: true,
      message: "Podcast deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting podcast:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete podcast",
    });
  }
};

module.exports = {
  getUserPodcasts,
  savePodcast,
  getPodcastById,
  deletePodcast,
};
