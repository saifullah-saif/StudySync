import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import {
  scheduleNextReview,
  selectDailySession,
  calculateExperience,
  calcLevelFromXP,
  DEFAULT_CONFIG,
  updateStreakData,
  getStreakData,
  checkStreakStatus,
  type DailySession,
  type Flashcard as LearningFlashcard,
} from "@/lib/learning";
import { flashcardAPI } from "@/lib/api";

interface Flashcard extends LearningFlashcard {}

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  deckId?: string;
}

const XP_PER_LEVEL = 100; // Define XP needed per level

export default function StudyFlashcards({
  flashcards,
  deckId,
}: StudyFlashcardsProps) {
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalXP: 0,
    streak: 0,
  });
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Utility functions
  const calculateSimpleXP = (isCorrect: boolean, intervalIndex: number) => {
    return isCorrect ? 10 + intervalIndex * 5 : 0;
  };

  const getLevel = (totalXP: number) => {
    return calcLevelFromXP(totalXP);
  };

  const getLevelProgress = (totalXP: number) => {
    const currentLevelXP = totalXP % XP_PER_LEVEL;
    return (currentLevelXP / XP_PER_LEVEL) * 100;
  };

  const getAccuracy = (correct: number, incorrect: number) => {
    const total = correct + incorrect;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  // Initialize study session
  useEffect(() => {
    const initializeSession = async () => {
      // Load stored XP and level
      const storedXP = parseInt(localStorage.getItem("studyXP") || "0");
      const storedLevel = getLevel(storedXP);
      setUserXP(storedXP);
      setUserLevel(storedLevel);

      // Select cards for today's session using spaced repetition
      const session = selectDailySession(flashcards, DEFAULT_CONFIG);
      const sessionCards = [...session.reviews, ...session.news];
      setStudyCards(sessionCards);

      if (sessionCards.length === 0) {
        setIsSessionComplete(true);
      }
    };

    if (flashcards.length > 0) {
      initializeSession();
    }
  }, [flashcards]);

  // Save progress to backend and localStorage
  const saveProgress = async (updatedCard: Flashcard) => {
    try {
      // Attempt to save to backend
      const result = await flashcardAPI.updateCard(updatedCard.id, {
        intervalIndex: updatedCard.intervalIndex,
        nextReview: updatedCard.nextReview,
        correctCount: updatedCard.correctCount,
        incorrectCount: updatedCard.incorrectCount,
        isEncountered: updatedCard.isEncountered,
        updatedAt: updatedCard.updatedAt,
      });

      if (!result.success) {
        console.warn("Backend save failed, using localStorage fallback");
      }
    } catch (error) {
      console.warn("Backend save error, using localStorage fallback:", error);
    }

    // Always save to localStorage as fallback
    const cardKey = `card_${updatedCard.id}`;
    localStorage.setItem(
      cardKey,
      JSON.stringify({
        intervalIndex: updatedCard.intervalIndex,
        nextReview: updatedCard.nextReview,
        correctCount: updatedCard.correctCount,
        incorrectCount: updatedCard.incorrectCount,
        isEncountered: updatedCard.isEncountered,
        updatedAt: updatedCard.updatedAt,
      })
    );
  };

  const handleAnswer = async (isCorrect: boolean) => {
    const currentCard = studyCards[currentIndex];
    if (!currentCard) return;

    // Update learning state using spaced repetition algorithm
    const updatedCard = scheduleNextReview(currentCard, isCorrect);

    // Calculate XP earned
    const xpEarned = calculateSimpleXP(
      isCorrect,
      updatedCard.intervalIndex || 0
    );
    const newTotalXP = userXP + xpEarned;
    const newLevel = getLevel(newTotalXP);

    // Update session stats
    const newStats = {
      ...sessionStats,
      correct: sessionStats.correct + (isCorrect ? 1 : 0),
      incorrect: sessionStats.incorrect + (isCorrect ? 0 : 1),
      totalXP: sessionStats.totalXP + xpEarned,
      streak: isCorrect ? sessionStats.streak + 1 : 0,
    };

    // Update state
    setSessionStats(newStats);
    setUserXP(newTotalXP);
    setUserLevel(newLevel);

    // Update global statistics
    const totalFlashcardsReviewed =
      parseInt(localStorage.getItem("totalFlashcardsReviewed") || "0") + 1;
    const totalCorrect =
      parseInt(localStorage.getItem("totalCorrect") || "0") +
      (isCorrect ? 1 : 0);
    const totalIncorrect =
      parseInt(localStorage.getItem("totalIncorrect") || "0") +
      (isCorrect ? 0 : 1);

    localStorage.setItem(
      "totalFlashcardsReviewed",
      totalFlashcardsReviewed.toString()
    );
    localStorage.setItem("totalCorrect", totalCorrect.toString());
    localStorage.setItem("totalIncorrect", totalIncorrect.toString());

    // Save progress
    await saveProgress(updatedCard);

    // Save XP progress
    localStorage.setItem("studyXP", newTotalXP.toString());

    // Auto-advance to next card after a short delay
    setTimeout(() => {
      nextCard();
    }, 1000);
  };

  const nextCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      setIsSessionComplete(true);
      saveSessionStats();
    }
  };

  const saveSessionStats = async () => {
    const sessionData = {
      deckId,
      ...sessionStats,
      completedAt: new Date().toISOString(),
      cardsStudied: studyCards.length,
    };

    // Update streak data for completing a session
    const updatedStreakData = updateStreakData(true);

    try {
      await flashcardAPI.saveSessionProgress({
        ...sessionData,
        streakData: updatedStreakData,
      });
    } catch (error) {
      console.warn("Failed to save session stats:", error);
    }
  };

  const resetSession = () => {
    const session = selectDailySession(flashcards, DEFAULT_CONFIG);
    const sessionCards = [...session.reviews, ...session.news];
    setStudyCards(sessionCards);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({
      correct: 0,
      incorrect: 0,
      totalXP: 0,
      streak: 0,
    });
    setIsSessionComplete(false);
  };

  const currentCard = studyCards[currentIndex];
  const progress =
    studyCards.length > 0 ? ((currentIndex + 1) / studyCards.length) * 100 : 0;
  const accuracy = getAccuracy(sessionStats.correct, sessionStats.incorrect);
  const levelProgress = getLevelProgress(userXP);

  if (studyCards.length === 0 && !isSessionComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Target className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No Cards Due Today</h3>
          <p className="text-muted-foreground text-center">
            Great job! You've completed all your reviews for today. Come back
            tomorrow for more cards.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isSessionComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6" />
            Session Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats.correct}
                </div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {sessionStats.incorrect}
                </div>
                <div className="text-sm text-red-600">Incorrect</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  +{sessionStats.totalXP}
                </div>
                <div className="text-sm text-blue-600">XP Earned</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {getStreakData().currentStreak}
                </div>
                <div className="text-sm text-orange-600">Day Streak</div>
              </div>
            </div>

            {accuracy > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {accuracy}%
                </div>
                <div className="text-sm text-purple-600">Accuracy</div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Level {userLevel}</span>
              <Badge variant="secondary">{userXP} XP</Badge>
            </div>
          </div>

          <Button onClick={resetSession} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Study More Cards
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentCard) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header with level and progress */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-300" />
            <span className="font-semibold">Level {userLevel}</span>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-0"
            >
              {userXP} XP
            </Badge>
          </div>
          <div className="text-sm">
            Card {currentIndex + 1} of {studyCards.length}
          </div>
        </div>
        <Progress value={levelProgress} className="h-2 bg-white/20" />
        <div className="text-xs mt-1 opacity-80">
          {XP_PER_LEVEL - (userXP % XP_PER_LEVEL)} XP to next level
        </div>
      </div>

      {/* Session Progress */}
      <div className="flex justify-between items-center px-4 py-2 bg-muted rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{sessionStats.correct}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>{sessionStats.incorrect}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span>Streak: {sessionStats.streak}</span>
          </div>
        </div>
        <Progress value={progress} className="w-24 h-2" />
      </div>

      {/* Main Flashcard */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-center text-lg">
            {showAnswer ? "Answer" : "Question"}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center space-y-6">
            <div className="text-xl font-medium min-h-[100px] flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              {showAnswer ? currentCard.answer : currentCard.question}
            </div>

            <div className="flex flex-col gap-3">
              {!showAnswer ? (
                <Button
                  onClick={() => setShowAnswer(true)}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  Show Answer
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleAnswer(false)}
                    variant="destructive"
                    size="lg"
                    className="flex items-center gap-2 shadow-md hover:scale-105 transition-transform"
                  >
                    <XCircle className="h-5 w-5" />
                    Mark Wrong
                  </Button>
                  <Button
                    onClick={() => handleAnswer(true)}
                    size="lg"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:scale-105 transition-transform"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Mark Correct
                  </Button>
                </div>
              )}

              {showAnswer && (
                <Button
                  onClick={nextCard}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Next Card
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Info */}
      {currentCard.intervalIndex !== undefined && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Learning Stage: {currentCard.intervalIndex + 1}/8</span>
              {currentCard.correctCount !== undefined &&
                currentCard.incorrectCount !== undefined && (
                  <span>
                    Success Rate:{" "}
                    {currentCard.correctCount + currentCard.incorrectCount > 0
                      ? Math.round(
                          (currentCard.correctCount /
                            (currentCard.correctCount +
                              currentCard.incorrectCount)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
