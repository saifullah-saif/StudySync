"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Eye, X, CheckCircle, XCircle } from "lucide-react";

export interface StudyFlashcard {
  id: string;
  question: string;
  answer: string;
  shownAnswer?: boolean;
  result?: "right" | "wrong" | null;
}

export interface StudyProps {
  flashcards?: StudyFlashcard[];
  title?: string;
  onQuit?: () => void;
  onFinish?: (summary: {
    total: number;
    correct: number;
    incorrect: number;
  }) => void;
  reviewWrong?: boolean;
}

export default function StudyFlashcards({
  flashcards: propFlashcards,
  title = "Study Session",
  onQuit,
  onFinish,
  reviewWrong = false,
}: StudyProps) {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<StudyFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"right" | "wrong" | null>(
    null
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useRef(false);

  // Load flashcards from sessionStorage or props
  useEffect(() => {
    const loadFlashcards = () => {
      try {
        let cards: StudyFlashcard[] = [];

        if (propFlashcards && propFlashcards.length > 0) {
          cards = propFlashcards;
        } else {
          const raw = sessionStorage.getItem("currentFlashcards");
          if (raw) {
            const parsed = JSON.parse(raw);
            let deck = parsed.flashcards || parsed.qsAns || parsed;

            // Convert Q&A format to flashcard format if needed
            if (parsed.qsAns && Array.isArray(parsed.qsAns)) {
              deck = parsed.qsAns.map((item: any, index: number) => ({
                id: `card-${index + 1}`,
                question: item.question,
                answer: item.answer,
              }));
            }

            cards = (deck || []).map((c: any, i: number) => ({
              id: c.id ?? String(i + 1),
              question: c.question ?? c.q ?? "",
              answer: c.answer ?? c.a ?? "",
              shownAnswer: false,
              result: null,
            }));
          }
        }

        // Filter for review mode
        if (reviewWrong) {
          cards = cards.filter((card) => card.result === "wrong");
        }

        setFlashcards(cards);

        // Load progress from sessionStorage
        const savedProgress = sessionStorage.getItem("studyProgress");
        if (savedProgress && !reviewWrong) {
          const progress = JSON.parse(savedProgress);
          setCurrentIndex(progress.currentIndex || 0);
          setCorrect(progress.correct || 0);
          setIncorrect(progress.incorrect || 0);
        }
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        setFlashcards([]);
      } finally {
        setLoading(false);
      }
    };

    loadFlashcards();

    // Check for reduced motion preference
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReducedMotion.current = mediaQuery.matches;
    }
  }, [propFlashcards, reviewWrong]);

  // Save progress to sessionStorage
  const saveProgress = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "studyProgress",
        JSON.stringify({
          currentIndex,
          correct,
          incorrect,
        })
      );
    }
  }, [currentIndex, correct, incorrect]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle keyboard events when waiting or dialog is open
      if (waiting || showSummary) {
        console.log(
          "🔧 Debug: Keyboard event ignored - waiting:",
          waiting,
          "showSummary:",
          showSummary
        );
        return;
      }

      console.log(
        "🔧 Debug: Key pressed:",
        event.key,
        "showAnswer:",
        showAnswer
      );

      switch (event.key.toLowerCase()) {
        case "q":
        case "escape":
          console.log("🔧 Debug: Quit key pressed");
          handleQuit();
          break;
        case " ":
        case "enter":
          event.preventDefault();
          if (!showAnswer) {
            console.log("🔧 Debug: Show answer key pressed");
            handleShowAnswer();
          }
          break;
        case "r":
          if (showAnswer) {
            console.log("🔧 Debug: Right key pressed");
            event.preventDefault(); // Prevent any default behavior
            handleMarkRight();
          }
          break;
        case "w":
          if (showAnswer) {
            console.log("🔧 Debug: Wrong key pressed");
            event.preventDefault(); // Prevent any default behavior
            handleMarkWrong();
          }
          break;
        case "arrowright":
          if (showAnswer) {
            console.log("🔧 Debug: Arrow right key pressed");
            event.preventDefault(); // Prevent any default behavior
            handleMarkRight(); // Default to right on arrow
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showAnswer, waiting, showSummary]); // Fixed dependencies

  // Save progress when state changes
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentCard = flashcards[currentIndex];

  const handleShowAnswer = useCallback(() => {
    if (waiting) return;
    setShowAnswer(true);

    // Update card state
    setFlashcards((prev) =>
      prev.map((card, index) =>
        index === currentIndex ? { ...card, shownAnswer: true } : card
      )
    );
  }, [waiting, currentIndex]);

  const handleMarkRight = useCallback(() => {
    if (waiting) return;

    console.log("🔧 Debug: handleMarkRight called");
    console.log("🔧 Debug: currentIndex before increment:", currentIndex);
    console.log("🔧 Debug: correct before increment:", correct);

    setCorrect((prev) => {
      console.log("🔧 Debug: setCorrect - prev:", prev, "new:", prev + 1);
      return prev + 1;
    });
    setFeedbackType("right");
    markCardAndAdvance("right");
  }, [waiting, currentIndex, correct]);

  const handleMarkWrong = useCallback(() => {
    if (waiting) return;

    console.log("🔧 Debug: handleMarkWrong called");
    setIncorrect((prev) => prev + 1);
    setFeedbackType("wrong");
    markCardAndAdvance("wrong");
  }, [waiting]);

  const markCardAndAdvance = useCallback(
    (result: "right" | "wrong") => {
      console.log("🔧 Debug: markCardAndAdvance called with result:", result);
      setWaiting(true);

      // Update card result
      setFlashcards((prev) =>
        prev.map((card, index) =>
          index === currentIndex ? { ...card, result } : card
        )
      );

      // Auto-advance after 1 second
      console.log("🔧 Debug: Setting timeout for auto-advance");
      timeoutRef.current = setTimeout(() => {
        console.log("🔧 Debug: Timeout triggered - calling goToNextCard");
        goToNextCard();
      }, 1000);
    },
    [currentIndex]
  );

  const goToNextCard = useCallback(() => {
    console.log("🔧 Debug: goToNextCard called");
    console.log("🔧 Debug: currentIndex before advance:", currentIndex);
    console.log("🔧 Debug: flashcards.length:", flashcards.length);

    setWaiting(false);
    setFeedbackType(null);
    setShowAnswer(false);

    if (currentIndex + 1 < flashcards.length) {
      console.log("🔧 Debug: Advancing to next card");
      setCurrentIndex((prev) => {
        console.log(
          "🔧 Debug: setCurrentIndex - prev:",
          prev,
          "new:",
          prev + 1
        );
        return prev + 1;
      });
    } else {
      // Finished all cards
      console.log("🔧 Debug: Finished all cards - calling finishStudy");
      finishStudy();
    }
  }, [currentIndex, flashcards.length]);

  const finishStudy = useCallback(() => {
    // Clear saved progress
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("studyProgress");
    }

    setShowSummary(true);

    if (onFinish) {
      onFinish({
        total: flashcards.length,
        correct,
        incorrect,
      });
    }
  }, [flashcards.length, correct, incorrect, onFinish]);

  const handleQuit = useCallback(() => {
    // Clear timeout if running
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (onQuit) {
      onQuit();
    } else {
      router.back();
    }
  }, [onQuit, router]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrect(0);
    setIncorrect(0);
    setShowSummary(false);
    setWaiting(false);
    setFeedbackType(null);

    // Reset all card states
    setFlashcards((prev) =>
      prev.map((card) => ({
        ...card,
        shownAnswer: false,
        result: null,
      }))
    );

    // Clear saved progress
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("studyProgress");
    }
  }, []);

  const handleReviewWrong = useCallback(() => {
    // TODO: Implement review wrong cards only
    console.log("Review wrong cards - TODO");
    setShowSummary(false);
    // For now, just close and go back
    handleQuit();
  }, [handleQuit]);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    handleQuit();
  }, [handleQuit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 mt-4">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {reviewWrong
              ? "No wrong cards to review!"
              : "No flashcards to study"}
          </h2>
          <p className="text-gray-600 mb-6">
            {reviewWrong
              ? "You got all the cards right! Great job!"
              : "Generate flashcards from a PDF file first."}
          </p>
          <Button onClick={handleQuit}>Go Back</Button>
        </div>
      </div>
    );
  }

  const accuracy =
    flashcards.length > 0
      ? Math.round((correct / (correct + incorrect)) * 100) || 0
      : 0;

  // Debug: Log state changes
  console.log("🔧 Debug Render:", {
    currentIndex,
    showAnswer,
    waiting,
    feedbackType,
    correct,
    incorrect,
    flashcardsLength: flashcards.length,
    currentCard: currentCard?.question?.substring(0, 30) + "...",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Debug info - development only */}
      {process.env.NODE_ENV === "development" && (
        <div className="max-w-2xl mx-auto mb-4 p-2 bg-yellow-100 text-xs text-gray-700 rounded">
          <strong>Debug:</strong> Index: {currentIndex}, Show:{" "}
          {showAnswer ? "Y" : "N"}, Wait: {waiting ? "Y" : "N"}, Type:{" "}
          {feedbackType || "none"}
        </div>
      )}

      {/* Header with progress */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 text-sm">
              Study mode - Focus on one card at a time
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Card {currentIndex + 1} / {flashcards.length}
          </Badge>
        </div>

        {/* Progress and stats */}
        <div className="flex gap-4 text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{correct} correct</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>{incorrect} wrong</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
            }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={0}
            aria-valuemax={flashcards.length}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-2xl mx-auto">
        <Card
          className={`relative transition-all duration-300 ${
            prefersReducedMotion.current
              ? ""
              : showAnswer
              ? "transform scale-105"
              : ""
          }`}
        >
          <CardContent className="p-8 md:p-12 min-h-[300px] flex flex-col justify-center">
            {/* Question */}
            <div className="text-center mb-8">
              <div className="text-lg md:text-xl font-semibold text-gray-900 mb-4 leading-relaxed">
                {currentCard?.question || "No content"}
              </div>

              {/* Answer (revealed) */}
              {showAnswer && (
                <div
                  className={`text-base text-gray-700 leading-relaxed border-t pt-6 mt-6 ${
                    prefersReducedMotion.current
                      ? "opacity-100"
                      : "animate-in fade-in duration-300"
                  }`}
                  role="region"
                  aria-live="polite"
                  aria-label="Answer revealed"
                >
                  {currentCard?.answer || "No content"}
                </div>
              )}
            </div>

            {/* Feedback indicator */}
            {waiting && feedbackType && (
              <div className="absolute top-4 right-4">
                {feedbackType === "right" ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center mt-6">
          {!showAnswer ? (
            // Question phase buttons
            <>
              <Button variant="outline" onClick={handleQuit} disabled={waiting}>
                <X className="h-4 w-4 mr-2" />
                Quit
              </Button>
              <Button
                onClick={handleShowAnswer}
                disabled={waiting}
                aria-expanded={showAnswer}
                aria-controls="answer-content"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show Answer
              </Button>
            </>
          ) : (
            // Answer phase buttons
            <>
              <Button
                variant="outline"
                onClick={handleMarkWrong}
                disabled={waiting}
                className={
                  waiting && feedbackType === "wrong" ? "bg-red-50" : ""
                }
                aria-pressed={waiting && feedbackType === "wrong"}
              >
                {waiting && feedbackType === "wrong" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Mark Wrong
              </Button>
              <Button
                onClick={handleMarkRight}
                disabled={waiting}
                className={
                  waiting && feedbackType === "right" ? "bg-green-50" : ""
                }
                aria-pressed={waiting && feedbackType === "right"}
              >
                {waiting && feedbackType === "right" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Make Right
              </Button>
            </>
          )}
        </div>

        {/* Debug button - temporary */}
        {process.env.NODE_ENV === "development" && (
          <div className="flex justify-center mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log("🔧 Debug: Manual advance clicked");
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                goToNextCard();
              }}
            >
              Debug: Next Card
            </Button>
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            Keyboard: <kbd className="bg-gray-200 px-1 rounded">Q</kbd> Quit •
            <kbd className="bg-gray-200 px-1 rounded ml-1">Space</kbd> Show
            Answer •<kbd className="bg-gray-200 px-1 rounded ml-1">R</kbd> Right
            •<kbd className="bg-gray-200 px-1 rounded ml-1">W</kbd> Wrong
          </p>
        </div>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Study Session Complete!</DialogTitle>
            <DialogDescription>
              Here's how you performed on this deck.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {correct}
                </div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {incorrect}
                </div>
                <div className="text-sm text-red-600">Wrong</div>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-700">
                {accuracy}%
              </div>
              <div className="text-sm text-blue-600">Accuracy</div>
            </div>

            <div className="text-center text-gray-600">
              <p>Total Cards: {flashcards.length}</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCloseSummary}>
              Close
            </Button>
            {incorrect > 0 && (
              <Button variant="outline" onClick={handleReviewWrong}>
                Review Wrong
              </Button>
            )}
            <Button onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {waiting &&
          `Moving to ${
            feedbackType === "right" ? "correct" : "incorrect"
          } pile`}
        {showAnswer && "Answer revealed"}
        {showSummary &&
          `Study complete. ${correct} correct, ${incorrect} wrong, ${accuracy}% accuracy`}
      </div>
    </div>
  );
}
