const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Get user's flashcard decks
 */
const getUserDecks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const decks = await prisma.flashcard_decks.findMany({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      include: {
        flashcards: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: parseInt(limit),
    });

    const totalCount = await prisma.flashcard_decks.count({
      where: {
        user_id: userId,
        is_deleted: false,
      },
    });

    const formattedDecks = decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      cardCount: deck._count.flashcards,
      createdAt: deck.created_at,
      creationMethod: deck.creation_method,
      color: deck.color,
    }));

    res.json({
      success: true,
      data: {
        decks: formattedDecks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user decks error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get decks",
    });
  }
};

/**
 * Get deck details with flashcards
 */
const getDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deck = await prisma.flashcard_decks.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
        is_deleted: false,
      },
      include: {
        flashcards: {
          include: {
            flashcard_options: {
              orderBy: {
                option_order: "asc",
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Deck not found or access denied",
      });
    }

    res.json({
      success: true,
      data: deck,
    });
  } catch (error) {
    console.error("Get deck error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get deck",
    });
  }
};

/**
 * Create a practice session
 */
const createPracticeSession = async (req, res) => {
  try {
    const { deckId, sessionType = "all_cards" } = req.body;
    const userId = req.user.id;

    // Verify deck ownership
    const deck = await prisma.flashcard_decks.findFirst({
      where: {
        id: parseInt(deckId),
        user_id: userId,
        is_deleted: false,
      },
      include: {
        flashcards: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Deck not found or access denied",
      });
    }

    if (deck.flashcards.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot start practice session - deck has no flashcards",
      });
    }

    // Create practice session
    const session = await prisma.study_sessions.create({
      data: {
        user_id: userId,
        deck_id: parseInt(deckId),
        session_type: sessionType,
        cards_studied: 0,
        cards_correct: 0,
        total_time_seconds: 0,
        started_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        deckId: deck.id,
        deckTitle: deck.title,
        totalCards: deck.flashcards.length,
      },
    });
  } catch (error) {
    console.error("Create practice session error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create practice session",
    });
  }
};

/**
 * Get practice session details
 */
const getPracticeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await prisma.study_sessions.findFirst({
      where: {
        id: parseInt(sessionId),
        user_id: userId,
      },
      include: {
        flashcard_decks: {
          include: {
            flashcards: {
              include: {
                flashcard_options: {
                  orderBy: {
                    option_order: "asc",
                  },
                },
              },
              orderBy: {
                created_at: "asc",
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Practice session not found or access denied",
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          deckId: session.deck_id,
          sessionType: session.session_type,
          cardsStudied: session.cards_studied,
          cardsCorrect: session.cards_correct,
          totalTimeSeconds: session.total_time_seconds,
          startedAt: session.started_at,
          completedAt: session.completed_at,
        },
        deck: session.flashcard_decks,
      },
    });
  } catch (error) {
    console.error("Get practice session error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get practice session",
    });
  }
};

/**
 * Record a flashcard attempt
 */
const recordFlashcardAttempt = async (req, res) => {
  try {
    const { sessionId, flashcardId, isCorrect, responseTimeSeconds } = req.body;
    const userId = req.user.id;

    // Verify session ownership
    const session = await prisma.study_sessions.findFirst({
      where: {
        id: parseInt(sessionId),
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Practice session not found or access denied",
      });
    }

    // Record the attempt
    await prisma.flashcard_attempts.create({
      data: {
        session_id: parseInt(sessionId),
        flashcard_id: parseInt(flashcardId),
        is_correct: Boolean(isCorrect),
        response_time_seconds: parseFloat(responseTimeSeconds) || 0,
        attempted_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Attempt recorded successfully",
    });
  } catch (error) {
    console.error("Record flashcard attempt error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to record attempt",
    });
  }
};

/**
 * Complete a practice session
 */
const completePracticeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { cardsStudied, cardsCorrect, totalTimeSeconds } = req.body;
    const userId = req.user.id;

    // Verify session ownership
    const session = await prisma.study_sessions.findFirst({
      where: {
        id: parseInt(sessionId),
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Practice session not found or access denied",
      });
    }

    // Update session with completion data
    const updatedSession = await prisma.study_sessions.update({
      where: {
        id: parseInt(sessionId),
      },
      data: {
        cards_studied: parseInt(cardsStudied),
        cards_correct: parseInt(cardsCorrect),
        total_time_seconds: parseInt(totalTimeSeconds),
        completed_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: updatedSession.id,
        cardsStudied: updatedSession.cards_studied,
        cardsCorrect: updatedSession.cards_correct,
        accuracy: updatedSession.cards_studied > 0 
          ? Math.round((updatedSession.cards_correct / updatedSession.cards_studied) * 100)
          : 0,
        totalTimeSeconds: updatedSession.total_time_seconds,
      },
    });
  } catch (error) {
    console.error("Complete practice session error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete practice session",
    });
  }
};

module.exports = {
  getUserDecks,
  getDeck,
  createPracticeSession,
  getPracticeSession,
  recordFlashcardAttempt,
  completePracticeSession,
};
