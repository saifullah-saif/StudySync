"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PracticeCard from "@/components/flashcards/PracticeCard";
import PracticeControls from "@/components/flashcards/PracticeControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface FlashcardOption {
  id: number;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  explanation?: string;
  difficulty_level: number;
  card_type: string;
  flashcard_options: FlashcardOption[];
}

interface PracticeSession {
  id: number;
  deckId: number;
  sessionType: string;
  cardsStudied: number;
  cardsCorrect: number;
  totalTimeSeconds: number;
  startedAt: string;
  endedAt?: string;
}

interface Deck {
  id: number;
  title: string;
  description: string;
  flashcards: Flashcard[];
}

interface AttemptRecord {
  flashcardId: number;
  isCorrect: boolean;
  responseTime: number;
  timestamp: number;
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = parseInt(params.sessionId as string);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  // FIX: Track time from when user actually starts practicing on THIS page
  const [practiceStartTime] = useState<number>(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const pauseStartRef = useRef<number | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    loadPracticeSession();
  }, [sessionId, user]);

  // FIX: Improved timer that tracks actual practice time (excluding pauses)
  useEffect(() => {
    if (isPaused || !session) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - practiceStartTime - pausedTime) / 1000);
      setTimeElapsed(elapsed);
    }, 100); // Update more frequently for smoother display

    return () => clearInterval(timer);
  }, [isPaused, session, practiceStartTime, pausedTime]);

  const loadPracticeSession = async () => {
    try {
      setLoading(true);
      const result = await practiceAPI.getPracticeSession(sessionId);

      if (result.success) {
        setSession(result.data.session);
        setDeck(result.data.deck);
      } else {
        toast.error(result.message || "Failed to load practice session");
        router.push("/assistant");
      }
    } catch (error) {
      console.error("Load practice session error:", error);
      toast.error("Failed to load practice session");
      router.push("/assistant");
    } finally {
      setLoading(false);
    }
  };

  const handleCardResult = async (isCorrect: boolean, responseTime: number) => {
    if (!session || !deck || !deck.flashcards[currentCardIndex]) return;

    const currentCard = deck.flashcards[currentCardIndex];

    // Record attempt locally
    const attempt: AttemptRecord = {
      flashcardId: currentCard.id,
      isCorrect,
      responseTime,
      timestamp: Date.now(),
    };

    setAttempts((prev) => [...prev, attempt]);

    // Move to next card immediately (don't wait for server)
    if (currentCardIndex < deck.flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);

      // Record attempt on server in background
      practiceAPI
        .recordFlashcardAttempt(
          sessionId,
          currentCard.id,
          isCorrect,
          responseTime
        )
        .catch((error) => {
          console.error("Failed to record attempt:", error);
        });
    } else {
      // Session complete - ensure last card is recorded before completing
      try {
        await practiceAPI.recordFlashcardAttempt(
          sessionId,
          currentCard.id,
          isCorrect,
          responseTime
        );
      } catch (error) {
        console.error("Failed to record final card attempt:", error);
      }

      // Small delay to ensure background processing completes
      setTimeout(async () => {
        await completeSession([...attempts, attempt]); // Include the final attempt
      }, 200);
      return;
    }
  };

  const completeSession = async (finalAttempts: AttemptRecord[]) => {
    if (!session || !deck) return;

    // FIX: Use the finalAttempts array which includes the last card
    const cardsStudied = finalAttempts.length;
    const cardsCorrect = finalAttempts.filter((a) => a.isCorrect).length;
    const totalTimeSeconds = timeElapsed; // Use our accurate timer

    console.log(`📊 Completing session:`, {
      cardsStudied,
      cardsCorrect,
      totalTimeSeconds,
      totalCards: deck.flashcards.length,
    });

    try {
      const result = await practiceAPI.completePracticeSession(
        sessionId,
        cardsStudied,
        cardsCorrect,
        totalTimeSeconds
      );

      if (result.success) {
        // Navigate to summary with actual data
        router.push(
          `/practice/${sessionId}/summary?cardsStudied=${cardsStudied}&cardsCorrect=${cardsCorrect}&totalTime=${totalTimeSeconds}`
        );
      } else {
        throw new Error(result.message || "Failed to complete session");
      }
    } catch (error) {
      console.error("Failed to complete session:", error);
      toast.error("Failed to save session results");
      // Still navigate to summary with local data as fallback
      router.push(
        `/practice/${sessionId}/summary?cardsStudied=${cardsStudied}&cardsCorrect=${cardsCorrect}&totalTime=${totalTimeSeconds}`
      );
    }
  };

  const handleUndo = () => {
    if (attempts.length === 0 || currentCardIndex === 0) return;

    // Remove last attempt
    setAttempts((prev) => prev.slice(0, -1));

    // Go back to previous card
    setCurrentCardIndex((prev) => prev - 1);

    toast.success("Last answer undone");
  };

  const handleSkip = () => {
    if (!deck || currentCardIndex >= deck.flashcards.length - 1) return;

    setCurrentCardIndex((prev) => prev + 1);
    toast.info("Card skipped");
  };

  const handlePause = () => {
    if (isPaused) {
      // Resuming - add the paused duration to total paused time
      if (pauseStartRef.current) {
        const pauseDuration = Date.now() - pauseStartRef.current;
        setPausedTime((prev) => prev + pauseDuration);
        pauseStartRef.current = null;
      }
      setIsPaused(false);
    } else {
      // Pausing - record when we paused
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const handleQuit = () => {
    setShowQuitDialog(true);
  };

  const confirmQuit = async () => {
    if (!session) return;

    const cardsStudied = attempts.length;
    const cardsCorrect = attempts.filter((a) => a.isCorrect).length;
    const totalTimeSeconds = timeElapsed;

    try {
      await practiceAPI.completePracticeSession(
        sessionId,
        cardsStudied,
        cardsCorrect,
        totalTimeSeconds
      );
    } catch (error) {
      console.error("Failed to save session on quit:", error);
    }

    router.push("/assistant");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <main className="flex items-center justify-center py-20">
          <Card className="w-96 shadow-xl border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-700 font-medium">Loading practice session...</p>
              <p className="text-gray-500 text-sm mt-2">Preparing your flashcards</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!session || !deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <main className="flex items-center justify-center py-20">
          <Card className="w-96 shadow-xl border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
              <p className="text-gray-900 font-bold text-lg mb-2">
                Session not found
              </p>
              <p className="text-gray-600 text-center mb-6">
                The practice session could not be loaded.
              </p>
              <Button onClick={() => router.push("/assistant")} size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const currentCard = deck.flashcards[currentCardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Practice Controls */}
      <PracticeControls
        currentCard={currentCardIndex + 1}
        totalCards={deck.flashcards.length}
        timeElapsed={timeElapsed}
        onUndo={handleUndo}
        onSkip={handleSkip}
        onPause={handlePause}
        onQuit={handleQuit}
        isPaused={isPaused}
        canUndo={attempts.length > 0 && currentCardIndex > 0}
      />

      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Session Header */}
          <div className="text-center mb-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {deck.title}
            </h1>
            <p className="text-gray-600 text-lg">
              Practice Session • {deck.flashcards.length} cards
            </p>
          </div>

          {/* Practice Card */}
          {currentCard && (
            <div className="animate-in slide-in-from-bottom duration-300">
              <PracticeCard
                flashcard={currentCard}
                onResult={handleCardResult}
                disabled={isPaused}
              />
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
              <Card className="w-96 shadow-2xl border-0 animate-in zoom-in duration-300">
                <CardContent className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Session Paused</h3>
                  <p className="text-gray-600 mb-8">
                    Take your time. Click resume when you're ready to continue.
                  </p>
                  <Button
                    onClick={handlePause}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    Resume Practice
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Quit Confirmation Dialog */}
      <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Quit Practice Session?</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Your progress will be saved, but you'll need to start a new
              session to continue practicing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowQuitDialog(false)}
              className="flex-1"
              size="lg"
            >
              Continue Practicing
            </Button>
            <Button
              onClick={confirmQuit}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              Quit Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
