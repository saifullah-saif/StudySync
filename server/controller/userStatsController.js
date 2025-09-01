const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create user stats
    let userStats = await prisma.user_stats.findUnique({
      where: { user_id: userId },
    });

    if (!userStats) {
      // Create initial stats record
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

    // Calculate today's stats from card_reviews
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReviews = await prisma.card_reviews.findMany({
      where: {
        card_progress: {
          user_id: userId,
        },
        reviewed_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const cardsToday = todayReviews.length;
    const correctToday = todayReviews.filter(
      (review) =>
        review.user_response === "correct" || review.user_response === "easy"
    ).length;
    const accuracyToday =
      cardsToday > 0 ? Math.round((correctToday / cardsToday) * 100) : 0;

    res.json({
      success: true,
      data: {
        // Overall stats
        totalCardsReviewed: userStats.total_cards_reviewed || 0,
        totalDecksCreated: userStats.total_decks_created || 0,
        totalNotesProcessed: userStats.total_notes_processed || 0,
        currentStreak: userStats.current_study_streak_days || 0,
        longestStreak: userStats.longest_study_streak_days || 0,
        overallAccuracy: parseFloat(userStats.overall_accuracy) || 0,
        cardsNew: userStats.cards_new || 0,
        cardsLearning: userStats.cards_learning || 0,
        cardsMastered: userStats.cards_mastered || 0,
        lastStudyDate: userStats.last_study_date,

        // Today's stats
        cardsToday,
        correctToday,
        accuracyToday,

        // XP and level calculation
        xp: (userStats.total_cards_reviewed || 0) * 10,
        level:
          Math.floor(((userStats.total_cards_reviewed || 0) * 10) / 100) + 1,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
      error: error.message,
    });
  }
};

/**
 * Update user statistics when a flashcard session is completed
 */
const updateUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      cardsReviewed,
      cardsCorrect,
      sessionTimeMinutes,
      newCardsStudied = 0,
      cardsAdvanced = 0,
    } = req.body;

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

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStudyDate = userStats.last_study_date
      ? new Date(userStats.last_study_date)
      : null;

    let currentStreak = userStats.current_study_streak_days || 0;
    let longestStreak = userStats.longest_study_streak_days || 0;

    // Update streak if this is a new day
    if (!lastStudyDate || lastStudyDate.getTime() !== today.getTime()) {
      if (lastStudyDate) {
        const daysDiff = Math.floor(
          (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak += 1;
        } else if (daysDiff > 1) {
          // Streak broken
          currentStreak = 1;
        }
        // If daysDiff === 0, it's the same day, don't change streak
      } else {
        // First time studying
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    // Calculate new overall accuracy
    const totalReviewed = (userStats.total_cards_reviewed || 0) + cardsReviewed;
    const totalCorrect =
      ((userStats.overall_accuracy || 0) / 100) *
        (userStats.total_cards_reviewed || 0) +
      cardsCorrect;
    const newAccuracy =
      totalReviewed > 0 ? (totalCorrect / totalReviewed) * 100 : 0;

    // Update stats
    const updatedStats = await prisma.user_stats.update({
      where: { user_id: userId },
      data: {
        total_cards_reviewed: totalReviewed,
        total_study_time_minutes:
          (userStats.total_study_time_minutes || 0) + (sessionTimeMinutes || 0),
        current_study_streak_days: currentStreak,
        longest_study_streak_days: longestStreak,
        overall_accuracy: newAccuracy,
        cards_new: Math.max(
          0,
          (userStats.cards_new || 0) - newCardsStudied + newCardsStudied
        ),
        cards_learning: (userStats.cards_learning || 0) + cardsAdvanced,
        last_study_date: today,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: "User statistics updated successfully",
      data: updatedStats,
    });
  } catch (error) {
    console.error("Update user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getUserStats,
  updateUserStats,
};
