const { PrismaClient } = require("@prisma/client");
const flashcardGenerationService = require("../services/flashcardGenerationService");

const prisma = new PrismaClient();

/**
 * Start flashcard generation from an uploaded file
 */
const generateFlashcardsFromFile = async (req, res) => {
  try {
    console.log("🔍 Generation request received");
    console.log("Headers:", req.headers);
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const { documentId } = req.params;
    const {
      deckTitle,
      cardType = "basic",
      targetDifficulty = 3,
      maxCards = 20,
      templateId = null,
    } = req.body;
    const userId = req.user?.id;

    // Validate inputs
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Validate parameters
    if (maxCards < 1 || maxCards > 100) {
      return res.status(400).json({
        success: false,
        message: "Max cards must be between 1 and 100",
      });
    }

    if (targetDifficulty < 1 || targetDifficulty > 5) {
      return res.status(400).json({
        success: false,
        message: "Target difficulty must be between 1 and 5",
      });
    }

    if (!["basic", "multiple_choice"].includes(cardType)) {
      return res.status(400).json({
        success: false,
        message: "Card type must be 'basic' or 'multiple_choice'",
      });
    }

    // Check if document exists and user has access
    const document = await prisma.notes.findFirst({
      where: {
        id: parseInt(documentId),
        user_id: userId,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied",
      });
    }

    // For mock testing, skip job conflict check and return mock response immediately
    // TODO: Re-enable job conflict check when implementing real generation service
    console.log("🚀 Flashcard generation request received:");
    console.log("Document ID:", documentId);
    console.log("User ID:", userId);
    console.log("Options:", {
      deckTitle: deckTitle || document.title,
      cardType,
      targetDifficulty,
      maxCards,
    });

    const mockResult = {
      jobId: Math.floor(Math.random() * 1000),
      status: "completed", // Mock as completed for testing
      deckId: 1, // Mock deck ID for testing redirect
      cardsGenerated: Math.floor(Math.random() * 15) + 5, // Mock 5-20 cards
      message:
        "Mock flashcard generation completed (OpenAI integration pending)",
    };

    res.status(200).json({
      success: true,
      data: mockResult,
      message: "Flashcard generation request processed (mock response)",
    });
  } catch (error) {
    console.error("Generate flashcards error:", error);

    // For database errors, still return mock response to keep UI working
    if (error.code === "P2002" || error.message.includes("database")) {
      console.log("🔄 Database error, returning mock response anyway");
      const mockResult = {
        jobId: Math.floor(Math.random() * 1000),
        status: "completed",
        deckId: 1,
        cardsGenerated: Math.floor(Math.random() * 15) + 5,
        message:
          "Mock flashcard generation completed (database error bypassed)",
      };

      return res.status(200).json({
        success: true,
        data: mockResult,
        message: "Flashcard generation request processed (mock response)",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to start flashcard generation",
    });
  }
};

/**
 * Get generation job status
 */
const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Mock job status response
    const mockJobStatus = {
      jobId: parseInt(jobId),
      status: "completed",
      deckId: 1,
      cardsGenerated: Math.floor(Math.random() * 15) + 5,
      documentTitle: "Mock Document",
      message: "Mock job completed successfully",
    };

    res.json({
      success: true,
      data: mockJobStatus,
    });
  } catch (error) {
    console.error("Get job status error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to get job status",
    });
  }
};

/**
 * Get user's generation jobs
 */
const getUserJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      user_id: userId,
    };

    if (
      status &&
      ["queued", "processing", "completed", "failed"].includes(status)
    ) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.generation_jobs.count({ where });

    // Get jobs
    const jobs = await prisma.generation_jobs.findMany({
      where,
      include: {
        notes: {
          select: {
            title: true,
            file_name: true,
          },
        },
        generation_templates: {
          select: {
            name: true,
            card_type: true,
            target_difficulty: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: parseInt(limit),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      documentId: job.document_id,
      documentTitle: job.notes?.title,
      documentFileName: job.notes?.file_name,
      status: job.status,
      cardsGenerated: job.cards_generated || 0,
      errorMessage: job.error_message,
      templateName: job.generation_templates?.name,
      cardType: job.generation_templates?.card_type,
      targetDifficulty: job.generation_templates?.target_difficulty,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      createdAt: job.created_at,
    }));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user jobs error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get generation jobs",
    });
  }
};

/**
 * Cancel a generation job
 */
const cancelJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Check if job exists and user has access
    const job = await prisma.generation_jobs.findFirst({
      where: {
        id: parseInt(jobId),
        user_id: userId,
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or access denied",
      });
    }

    // Check if job can be cancelled
    if (!["queued", "processing"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel job with status: ${job.status}`,
      });
    }

    // Update job status to cancelled
    await prisma.generation_jobs.update({
      where: { id: parseInt(jobId) },
      data: {
        status: "failed",
        error_message: "Cancelled by user",
        completed_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel job",
    });
  }
};

/**
 * Get available generation templates
 */
const getGenerationTemplates = async (req, res) => {
  try {
    const templates = await prisma.generation_templates.findMany({
      where: {
        is_default: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        card_type: true,
        target_difficulty: true,
      },
      orderBy: [{ card_type: "asc" }, { target_difficulty: "asc" }],
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Get generation templates error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get generation templates",
    });
  }
};

module.exports = {
  generateFlashcardsFromFile,
  getJobStatus,
  getUserJobs,
  cancelJob,
  getGenerationTemplates,
};
