/**
 * Spaced Repetition Learning Algorithm
 * Evidence-based learning system with adaptive scheduling
 */

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  // persisted learning state
  intervalIndex?: number; // index into INTERVALS[], default 0 (new)
  nextReview?: string; // ISO date string for next review
  correctCount?: number; // cumulative times answered correctly
  incorrectCount?: number; // cumulative times answered incorrectly
  isEncountered?: boolean; // whether card has been shown at least once
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningConfig {
  maxNewPerDay: number; // default 10
  maxReviewsPerDay: number; // default 50
  autoAdvanceDelayMs: number; // 1000 (1 second)
}

export interface DailySession {
  reviews: Flashcard[];
  news: Flashcard[];
  sessionDeck: Flashcard[];
}

export interface SessionSummary {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  xp: number;
  level: number;
}

export interface StreakData {
  currentStreak: number; // current consecutive days
  longestStreak: number; // all-time longest streak
  lastPracticeDate: string; // ISO date string of last practice
  streakFrozen: boolean; // whether streak is frozen (for streak freeze power-ups)
  streakHistory: string[]; // array of practice dates
}

// Spaced repetition intervals in days
export const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 120, 240];

// Default learning configuration
export const DEFAULT_CONFIG: LearningConfig = {
  maxNewPerDay: 10,
  maxReviewsPerDay: 50,
  autoAdvanceDelayMs: 1000,
};

/**
 * Get today's start time in UTC for consistent date comparisons
 */
export function getTodayStart(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Convert milliseconds to hours, minutes, seconds
 */
export function msToHMS(ms: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const absoluteTime = Math.abs(ms);
  const hours = Math.floor(absoluteTime / (1000 * 60 * 60));
  const minutes = Math.floor((absoluteTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absoluteTime % (1000 * 60)) / 1000);

  return {
    hours: ms >= 0 ? hours : -hours,
    minutes: ms >= 0 ? minutes : -minutes,
    seconds: ms >= 0 ? seconds : -seconds,
  };
}

/**
 * Countdown to next day (24 hours from now)
 */
export function countdownIn24Hours(): number {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.getTime() - now;
}

/**
 * Schedule the next review for a card based on performance
 */
export function scheduleNextReview(
  card: Flashcard,
  wasCorrect: boolean
): Flashcard {
  const today = getTodayStart();
  let intervalIndex = card.intervalIndex ?? 0;

  if (wasCorrect) {
    // Advance to next interval (up to maximum)
    intervalIndex = Math.min(intervalIndex + 1, INTERVALS_DAYS.length - 1);
  } else {
    // Reset to beginning on wrong answer
    intervalIndex = 0;
  }

  const days = INTERVALS_DAYS[intervalIndex];
  const nextReview = addDays(today, days);

  return {
    ...card,
    intervalIndex,
    nextReview: nextReview.toISOString(),
    correctCount: (card.correctCount || 0) + (wasCorrect ? 1 : 0),
    incorrectCount: (card.incorrectCount || 0) + (wasCorrect ? 0 : 1),
    isEncountered: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Select cards for today's learning session
 */
export function selectDailySession(
  cards: Flashcard[],
  config: LearningConfig = DEFAULT_CONFIG
): DailySession {
  const today = getTodayStart();
  const todayISO = today.toISOString();

  // Separate cards into categories
  const reviews: Flashcard[] = [];
  const futureReviews: Flashcard[] = [];
  const news: Flashcard[] = [];

  for (const card of cards) {
    if (!card.isEncountered || card.intervalIndex === undefined) {
      news.push(card);
    } else if (card.nextReview && card.nextReview <= todayISO) {
      reviews.push(card);
    } else if (card.nextReview && card.nextReview > todayISO) {
      futureReviews.push(card);
    }
  }

  // Sort reviews by oldest first (most overdue)
  reviews.sort((a, b) => {
    const aDate = new Date(a.nextReview || 0).getTime();
    const bDate = new Date(b.nextReview || 0).getTime();
    return aDate - bDate;
  });

  // Sort future reviews by nearest date
  futureReviews.sort((a, b) => {
    const aDate = new Date(a.nextReview || 0).getTime();
    const bDate = new Date(b.nextReview || 0).getTime();
    return aDate - bDate;
  });

  // Build session deck
  const sessionDeck: Flashcard[] = [];

  // Add due reviews (up to maxReviewsPerDay)
  const reviewsToAdd = reviews.slice(0, config.maxReviewsPerDay);
  sessionDeck.push(...reviewsToAdd);

  // If we have capacity, pull forward future reviews
  const reviewCapacityLeft = config.maxReviewsPerDay - reviewsToAdd.length;
  if (reviewCapacityLeft > 0) {
    const pullForward = futureReviews.slice(0, reviewCapacityLeft);
    sessionDeck.push(...pullForward);
  }

  // Add new cards if there's still capacity
  const totalCapacityUsed = sessionDeck.length;
  const newCardSlots = Math.min(
    config.maxNewPerDay,
    Math.max(0, config.maxReviewsPerDay - totalCapacityUsed)
  );

  if (newCardSlots > 0) {
    const newCards = news.slice(0, newCardSlots);
    sessionDeck.push(...newCards);
  }

  return {
    reviews: reviewsToAdd,
    news: news.slice(0, newCardSlots),
    sessionDeck: shuffle(sessionDeck), // Shuffle for variety
  };
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  let currentIndex = result.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ];
  }

  return result;
}

/**
 * Calculate accuracy percentage from cards
 */
export function calculateAccuracy(cards: Flashcard[]): number {
  const totalCorrect = cards.reduce(
    (sum, card) => sum + (card.correctCount || 0),
    0
  );
  const totalIncorrect = cards.reduce(
    (sum, card) => sum + (card.incorrectCount || 0),
    0
  );
  const total = totalCorrect + totalIncorrect;

  return total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
}

/**
 * Calculate experience points from cards
 */
export function calculateExperience(cards: Flashcard[]): number {
  return cards.reduce((xp, card) => {
    const correctCount = card.correctCount || 0;
    const intervalIndex = card.intervalIndex || 0;
    // Base XP + bonus for advanced intervals
    const baseXP = correctCount * 10;
    const bonusXP = correctCount * Math.floor(intervalIndex * 2);
    return xp + baseXP + bonusXP;
  }, 0);
}

/**
 * Calculate level from experience points
 */
export function calcLevelFromXP(totalXP: number): number {
  return Math.floor(totalXP / 100);
}

/**
 * Calculate level from cards
 */
export function calcLevel(cards: Flashcard[]): number {
  const xp = calculateExperience(cards);
  return calcLevelFromXP(xp);
}

/**
 * Calculate how many new words should be learned today
 */
export function calculateNewWords(
  cards: Flashcard[],
  config: LearningConfig
): number {
  const newCards = cards.filter(
    (card) => !card.isEncountered || card.intervalIndex === undefined
  );
  return Math.min(newCards.length, config.maxNewPerDay);
}

/**
 * Check if a word has been encountered before today
 */
export function isEncountered(card: Flashcard): boolean {
  return card.isEncountered === true;
}

/**
 * Generate session summary from cards and session history
 */
export function generateSessionSummary(
  sessionCards: Flashcard[],
  correctCount: number,
  incorrectCount: number
): SessionSummary {
  const total = sessionCards.length;
  const accuracy =
    total > 0
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) || 0
      : 0;
  const xp = calculateExperience(sessionCards);
  const level = calcLevelFromXP(xp);

  return {
    total,
    correct: correctCount,
    incorrect: incorrectCount,
    accuracy,
    xp,
    level,
  };
}

/**
 * Get cards that were answered incorrectly in session
 */
export function getWrongCards(
  sessionHistory: Array<{ card: Flashcard; wasCorrect: boolean }>
): Flashcard[] {
  return sessionHistory
    .filter((entry) => !entry.wasCorrect)
    .map((entry) => entry.card);
}

/**
 * Save learning progress to localStorage as fallback
 */
export function saveProgressToLocal(cards: Flashcard[]): void {
  try {
    const learningState = cards.reduce((acc, card) => {
      if (card.isEncountered) {
        acc[card.id] = {
          intervalIndex: card.intervalIndex,
          nextReview: card.nextReview,
          correctCount: card.correctCount,
          incorrectCount: card.incorrectCount,
          isEncountered: card.isEncountered,
          updatedAt: card.updatedAt,
        };
      }
      return acc;
    }, {} as Record<string, any>);

    localStorage.setItem(
      "studySync_learningProgress",
      JSON.stringify(learningState)
    );
  } catch (error) {
    console.warn("Failed to save learning progress to localStorage:", error);
  }
}

/**
 * Load learning progress from localStorage
 */
export function loadProgressFromLocal(cards: Flashcard[]): Flashcard[] {
  try {
    const saved = localStorage.getItem("studySync_learningProgress");
    if (!saved) return cards;

    const learningState = JSON.parse(saved);
    return cards.map((card) => ({
      ...card,
      ...learningState[card.id],
    }));
  } catch (error) {
    console.warn("Failed to load learning progress from localStorage:", error);
    return cards;
  }
}

/**
 * Streak Management Functions
 */

/**
 * Get current streak data from storage
 */
export function getStreakData(): StreakData {
  try {
    const saved = localStorage.getItem("studySync_streakData");
    if (!saved) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: "",
        streakFrozen: false,
        streakHistory: [],
      };
    }
    return JSON.parse(saved);
  } catch (error) {
    console.warn("Failed to load streak data:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: "",
      streakFrozen: false,
      streakHistory: [],
    };
  }
}

/**
 * Update streak data when user completes a study session
 */
export function updateStreakData(sessionCompleted: boolean = true): StreakData {
  const streakData = getStreakData();
  const today = getTodayStart().toISOString().split("T")[0]; // YYYY-MM-DD format
  const lastPracticeDate = streakData.lastPracticeDate.split("T")[0];

  // If already practiced today, don't update
  if (lastPracticeDate === today) {
    return streakData;
  }

  if (sessionCompleted) {
    // Calculate days since last practice
    const daysSinceLastPractice = lastPracticeDate
      ? Math.floor(
          (new Date(today).getTime() - new Date(lastPracticeDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    // Update streak based on gap
    if (daysSinceLastPractice <= 1) {
      // Consecutive day or same day
      streakData.currentStreak += 1;
    } else if (daysSinceLastPractice > 1 && !streakData.streakFrozen) {
      // Streak broken (more than 1 day gap)
      streakData.currentStreak = 1; // Start new streak
    }
    // If streak is frozen, maintain current streak despite gap

    // Update longest streak record
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    // Update practice date and history
    streakData.lastPracticeDate = new Date().toISOString();

    // Add to history (keep last 365 days)
    if (!streakData.streakHistory.includes(today)) {
      streakData.streakHistory.push(today);
      streakData.streakHistory = streakData.streakHistory.sort().slice(-365); // Keep only last year
    }

    // Remove streak freeze after use
    streakData.streakFrozen = false;
  }

  // Save updated streak data
  try {
    localStorage.setItem("studySync_streakData", JSON.stringify(streakData));
  } catch (error) {
    console.warn("Failed to save streak data:", error);
  }

  return streakData;
}

/**
 * Check if streak is broken and needs to be reset
 */
export function checkStreakStatus(): { isBroken: boolean; daysMissed: number } {
  const streakData = getStreakData();
  if (!streakData.lastPracticeDate) {
    return { isBroken: false, daysMissed: 0 };
  }

  const today = getTodayStart();
  const lastPractice = new Date(streakData.lastPracticeDate.split("T")[0]);
  const daysSinceLastPractice = Math.floor(
    (today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Streak is broken if more than 1 day has passed (allowing for same day and next day)
  const isBroken = daysSinceLastPractice > 1 && !streakData.streakFrozen;
  const daysMissed = Math.max(0, daysSinceLastPractice - 1);

  // If streak is broken, reset it (but preserve longest streak)
  if (isBroken && streakData.currentStreak > 0) {
    const updatedData = {
      ...streakData,
      currentStreak: 0,
    };

    try {
      localStorage.setItem("studySync_streakData", JSON.stringify(updatedData));
    } catch (error) {
      console.warn("Failed to reset broken streak:", error);
    }
  }

  return { isBroken, daysMissed };
}

/**
 * Freeze streak (power-up feature to prevent streak breaking)
 */
export function freezeStreak(): StreakData {
  const streakData = getStreakData();
  streakData.streakFrozen = true;

  try {
    localStorage.setItem("studySync_streakData", JSON.stringify(streakData));
  } catch (error) {
    console.warn("Failed to save streak freeze:", error);
  }

  return streakData;
}

/**
 * Get streak statistics for analytics
 */
export function getStreakStats(): {
  currentStreak: number;
  longestStreak: number;
  totalPracticeDays: number;
  averagePerWeek: number;
  lastPracticeDate: string;
  streakStatus: "active" | "broken" | "frozen";
} {
  const streakData = getStreakData();
  const { isBroken } = checkStreakStatus();

  const totalPracticeDays = streakData.streakHistory.length;

  // Calculate average per week based on history
  const firstPracticeDate = streakData.streakHistory[0];
  const weeksActive = firstPracticeDate
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(firstPracticeDate).getTime()) /
            (1000 * 60 * 60 * 24 * 7)
        )
      )
    : 1;
  const averagePerWeek =
    Math.round((totalPracticeDays / weeksActive) * 10) / 10;

  const streakStatus = isBroken
    ? "broken"
    : streakData.streakFrozen
    ? "frozen"
    : "active";

  return {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    totalPracticeDays,
    averagePerWeek,
    lastPracticeDate: streakData.lastPracticeDate,
    streakStatus,
  };
}

/**
 * Get streak statistics from database
 */
export async function getStreakStatsFromDB(): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalPracticeDays: number;
  averagePerWeek: number;
  lastPracticeDate: string;
  streakStatus: "active" | "broken" | "frozen";
}> {
  try {
    const { statsAPI } = await import("./api");
    const response = await statsAPI.getUserStats();

    if (response.success) {
      return {
        currentStreak: response.data.currentStreak || 0,
        longestStreak: response.data.longestStreak || 0,
        totalPracticeDays: response.data.totalCardsReviewed || 0, // Approximate
        averagePerWeek: 0, // Would need more complex calculation
        lastPracticeDate: response.data.lastStudyDate || "",
        streakStatus: response.data.currentStreak > 0 ? "active" : "broken",
      };
    }
  } catch (error) {
    console.warn("Failed to load streak stats from database:", error);
  }

  // Fallback to localStorage
  return getStreakStats();
}

/**
 * Get today's study statistics from localStorage
 */
export function getTodayStats(): {
  cardsToday: number;
  correctToday: number;
  incorrectToday: number;
  accuracyToday: number;
} {
  const today = getTodayStart().toISOString().split("T")[0]; // YYYY-MM-DD format

  try {
    // Get today's session data
    const todaySessionKey = `studySync_session_${today}`;
    const todaySession = localStorage.getItem(todaySessionKey);

    if (todaySession) {
      const sessionData = JSON.parse(todaySession);
      const cardsToday =
        (sessionData.correct || 0) + (sessionData.incorrect || 0);
      const correctToday = sessionData.correct || 0;
      const incorrectToday = sessionData.incorrect || 0;
      const accuracyToday =
        cardsToday > 0 ? Math.round((correctToday / cardsToday) * 100) : 0;

      return {
        cardsToday,
        correctToday,
        incorrectToday,
        accuracyToday,
      };
    }
  } catch (error) {
    console.warn("Failed to load today's stats:", error);
  }

  return {
    cardsToday: 0,
    correctToday: 0,
    incorrectToday: 0,
    accuracyToday: 0,
  };
}

/**
 * Get today's study statistics from database
 */
export async function getTodayStatsFromDB(): Promise<{
  cardsToday: number;
  correctToday: number;
  incorrectToday: number;
  accuracyToday: number;
}> {
  try {
    const { statsAPI } = await import("./api");
    const response = await statsAPI.getUserStats();

    if (response.success) {
      return {
        cardsToday: response.data.cardsToday || 0,
        correctToday: response.data.correctToday || 0,
        incorrectToday:
          response.data.cardsToday - response.data.correctToday || 0,
        accuracyToday: response.data.accuracyToday || 0,
      };
    }
  } catch (error) {
    console.warn("Failed to load today's stats from database:", error);
  }

  // Fallback to localStorage
  return getTodayStats();
}

/**
 * Update today's study statistics
 */
export function updateTodayStats(correct: number, incorrect: number): void {
  const today = getTodayStart().toISOString().split("T")[0]; // YYYY-MM-DD format
  const todaySessionKey = `studySync_session_${today}`;

  try {
    let sessionData = { correct: 0, incorrect: 0 };

    const existingSession = localStorage.getItem(todaySessionKey);
    if (existingSession) {
      sessionData = JSON.parse(existingSession);
    }

    // Update with new stats
    sessionData.correct = (sessionData.correct || 0) + correct;
    sessionData.incorrect = (sessionData.incorrect || 0) + incorrect;

    localStorage.setItem(todaySessionKey, JSON.stringify(sessionData));
  } catch (error) {
    console.warn("Failed to update today's stats:", error);
  }
}

/**
 * Get comprehensive user stats including XP and level
 */
export function getUserStats(): {
  xp: number;
  level: number;
  flashcardsReviewed: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
} {
  try {
    const xp = parseInt(localStorage.getItem("studyXP") || "0");
    const level = calcLevelFromXP(xp);
    const flashcardsReviewed = parseInt(
      localStorage.getItem("totalFlashcardsReviewed") || "0"
    );
    const totalCorrect = parseInt(localStorage.getItem("totalCorrect") || "0");
    const totalIncorrect = parseInt(
      localStorage.getItem("totalIncorrect") || "0"
    );
    const overallAccuracy =
      totalCorrect + totalIncorrect > 0
        ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
        : 0;

    return {
      xp,
      level,
      flashcardsReviewed,
      totalCorrect,
      totalIncorrect,
      overallAccuracy,
    };
  } catch (error) {
    console.warn("Failed to load user stats:", error);
    return {
      xp: 0,
      level: 1,
      flashcardsReviewed: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      overallAccuracy: 0,
    };
  }
}

/**
 * Get comprehensive user stats from database
 */
export async function getUserStatsFromDB(): Promise<{
  xp: number;
  level: number;
  flashcardsReviewed: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
}> {
  try {
    const { statsAPI } = await import("./api");
    const response = await statsAPI.getUserStats();

    if (response.success) {
      const totalCards = response.data.totalCardsReviewed || 0;
      const accuracy = response.data.overallAccuracy || 0;

      // XP calculation: 5 XP per reviewed card + accuracy bonus
      const xp = totalCards * 5 + Math.floor(accuracy);
      const level = Math.floor(xp / 100) + 1;

      return {
        xp,
        level,
        flashcardsReviewed: totalCards,
        totalCorrect: Math.floor((totalCards * accuracy) / 100),
        totalIncorrect: totalCards - Math.floor((totalCards * accuracy) / 100),
        overallAccuracy: accuracy,
      };
    }
  } catch (error) {
    console.warn("Failed to load user stats from database:", error);
  }

  // Fallback to localStorage
  return getUserStats();
}

/**
 * Calculate time remaining until midnight
 */
export function getTimeUntilMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  ms: number;
} {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, ms: diff };
}
