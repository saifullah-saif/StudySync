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
          endedAt: session.ended_at,
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

    // Send response immediately to avoid UI delay
    res.json({
      success: true,
      message: "Attempt recorded successfully",
    });

    // Continue processing in background
    processFlashcardAttemptBackground(
      userId,
      sessionId,
      flashcardId,
      isCorrect,
      responseTimeSeconds
    );
  } catch (error) {
    console.error("Error recording flashcard attempt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record flashcard attempt",
    });
  }
};

/**
 * Background processing for flashcard attempts to avoid UI delays
 */
const processFlashcardAttemptBackground = async (
  userId,
  sessionId,
  flashcardId,
  isCorrect,
  responseTimeSeconds
) => {
  try {
    // Get or create card progress for this user and flashcard
    let cardProgress = await prisma.card_progress.findFirst({
      where: {
        user_id: userId,
        flashcard_id: parseInt(flashcardId),
      },
    });

    if (!cardProgress) {
      cardProgress = await prisma.card_progress.create({
        data: {
          user_id: userId,
          flashcard_id: parseInt(flashcardId),
          algorithm_id: null, // Set to null to avoid foreign key constraint
          current_interval: 1,
          ease_factor: 2.5,
          total_reviews: 0,
          correct_reviews: 0,
          consecutive_correct: 0,
          learning_stage: "new",
          mastery_level: 0,
        },
      });
    }

    // Process updates in parallel for better performance
    const wasCorrect = Boolean(isCorrect);

    const [updatedCardProgress, cardReview] = await Promise.all([
      // Update card progress statistics
      prisma.card_progress.update({
        where: { id: cardProgress.id },
        data: {
          total_reviews: cardProgress.total_reviews + 1,
          correct_reviews: cardProgress.correct_reviews + (wasCorrect ? 1 : 0),
          consecutive_correct: wasCorrect
            ? cardProgress.consecutive_correct + 1
            : 0,
          last_review_date: new Date(),
          last_response: wasCorrect ? "correct" : "incorrect",
          updated_at: new Date(),
        },
      }),

      // Record the review
      prisma.card_reviews.create({
        data: {
          session_id: parseInt(sessionId),
          card_progress_id: cardProgress.id,
          user_response: wasCorrect ? "correct" : "incorrect",
          response_time_ms: Math.round(
            (parseFloat(responseTimeSeconds) || 0) * 1000
          ),
          previous_interval: cardProgress.current_interval,
          new_interval: cardProgress.current_interval,
          previous_ease_factor: cardProgress.ease_factor,
          new_ease_factor: cardProgress.ease_factor,
          reviewed_at: new Date(),
        },
      }),
    ]);

    // Update user stats in background (don't wait for it)
    updateUserStatsRealTime(userId, isCorrect).catch((statsError) => {
      console.error("Failed to update user stats:", statsError);
    });
  } catch (error) {
    console.error("Background processing error:", error);
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

    // Get actual count from database records instead of trusting client
    const actualReviewCount = await prisma.card_reviews.count({
      where: {
        session_id: parseInt(sessionId),
      },
    });

    const correctReviewCount = await prisma.card_reviews.count({
      where: {
        session_id: parseInt(sessionId),
        user_response: "correct",
      },
    });

    console.log(
      `Session ${sessionId}: Client reported ${cardsStudied} cards, DB shows ${actualReviewCount} reviews`
    );

    // Update session with actual database counts
    const updatedSession = await prisma.study_sessions.update({
      where: {
        id: parseInt(sessionId),
      },
      data: {
        cards_studied: actualReviewCount, // Use database count
        cards_correct: correctReviewCount, // Use database count
        total_time_seconds: parseInt(totalTimeSeconds),
        ended_at: new Date(),
        is_completed: true,
      },
    });

    res.json({
      success: true,
      data: {
        session: {
          id: updatedSession.id,
          cardsStudied: actualReviewCount, // Return actual count
          cardsCorrect: correctReviewCount, // Return actual count
          totalTimeSeconds: updatedSession.total_time_seconds,
        },
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

/**
 * Create a manual flashcard deck
 */
const createDeck = async (req, res) => {
  try {
    console.log("createDeck called with body:", req.body);
    console.log("User:", req.user);

    const userId = req.user.id;
    const { title, description, flashcards } = req.body;

    console.log("Extracted data:", { userId, title, description, flashcards });

    // Validation
    if (!title || !title.trim()) {
      console.log("Validation failed: Title is required");
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      console.log("Validation failed: No flashcards provided");
      return res.status(400).json({
        success: false,
        message: "At least one flashcard is required",
      });
    }

    // Validate flashcards
    for (let i = 0; i < flashcards.length; i++) {
      const card = flashcards[i];
      if (
        !card.question ||
        !card.question.trim() ||
        !card.answer ||
        !card.answer.trim()
      ) {
        console.log(`Validation failed: Flashcard ${i + 1} invalid:`, card);
        return res.status(400).json({
          success: false,
          message: `Flashcard ${i + 1} must have both question and answer`,
        });
      }
    }

    console.log("All validation passed, creating deck...");

    // Create deck with flashcards in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log("Creating deck with data:", {
        title: title.trim(),
        description: description?.trim() || null,
        user_id: userId,
        creation_method: "manual",
        created_at: new Date(),
      });

      // Create the deck
      const deck = await tx.flashcard_decks.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          user_id: userId,
          creation_method: "manual",
          created_at: new Date(),
        },
      });

      console.log("Deck created:", deck);

      // Create flashcards
      const flashcardsData = flashcards.map((card, index) => ({
        deck_id: deck.id,
        question: card.question.trim(),
        answer: card.answer.trim(),
        explanation: card.explanation?.trim() || null,
        created_at: new Date(),
      }));

      console.log("Creating flashcards with data:", flashcardsData);

      await tx.flashcards.createMany({
        data: flashcardsData,
      });

      console.log("Flashcards created successfully");

      return deck;
    });

    console.log("Transaction completed successfully, sending response");

    res.json({
      success: true,
      data: {
        deck: {
          id: result.id,
          title: result.title,
          description: result.description,
          cardCount: flashcards.length,
          createdAt: result.created_at,
        },
      },
      message: "Deck created successfully",
    });
  } catch (error) {
    console.error("Error creating deck - Full error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to create deck",
      error: error.message,
    });
  }
};

/**
 * Helper function to update user stats in real-time
 */
async function updateUserStatsRealTime(userId, isCorrect) {
  try {
    // Get or create user stats
    let userStats = await prisma.user_stats.findUnique({
      where: { user_id: userId },
    });

    if (!userStats) {
      userStats = await prisma.user_stats.create({
        data: {
          user_id: userId,
          total_cards_created: 0,
          total_decks_created: 0,
          total_notes_processed: 0,
          total_study_time_minutes: 0,
          total_cards_reviewed: 0,
          current_study_streak_days: 0,
          longest_study_streak_days: 0,
          overall_accuracy: 0.0,
          cards_mastered: 0,
          cards_learning: 0,
          cards_new: 0,
          last_study_date: null,
        },
      });
    }

    // Calculate new totals
    const newTotalReviewed = (userStats.total_cards_reviewed || 0) + 1;
    const currentCorrect =
      ((userStats.overall_accuracy || 0) / 100) *
      (userStats.total_cards_reviewed || 0);
    const newTotalCorrect = currentCorrect + (isCorrect ? 1 : 0);
    const newAccuracy =
      newTotalReviewed > 0 ? (newTotalCorrect / newTotalReviewed) * 100 : 0;

    // Check for streak update
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStudyDate = userStats.last_study_date
      ? new Date(userStats.last_study_date)
      : null;

    let currentStreak = userStats.current_study_streak_days || 0;
    let longestStreak = userStats.longest_study_streak_days || 0;
    let shouldUpdateStreak = false;

    if (!lastStudyDate || lastStudyDate.getTime() !== today.getTime()) {
      shouldUpdateStreak = true;

      if (lastStudyDate) {
        const daysDiff = Math.floor(
          (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak += 1;
        } else if (daysDiff > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    // Update user stats
    await prisma.user_stats.update({
      where: { user_id: userId },
      data: {
        total_cards_reviewed: newTotalReviewed,
        overall_accuracy: newAccuracy,
        current_study_streak_days: currentStreak,
        longest_study_streak_days: longestStreak,
        last_study_date: shouldUpdateStreak ? today : userStats.last_study_date,
        updated_at: new Date(),
      },
    });

    console.log("✅ User stats updated:", {
      userId,
      totalReviewed: newTotalReviewed,
      accuracy: newAccuracy,
      streak: currentStreak,
      isCorrect,
    });
  } catch (error) {
    console.error("Failed to update user stats:", error);
    throw error;
  }
}

module.exports = {
  getUserDecks,
  getDeck,
  createDeck,
  createPracticeSession,
  getPracticeSession,
  recordFlashcardAttempt,
  completePracticeSession,
};
