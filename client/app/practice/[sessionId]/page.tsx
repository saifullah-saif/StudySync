"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
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
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    loadPracticeSession();
  }, [sessionId, user]);

  // Timer effect
  useEffect(() => {
    if (isPaused || !session) return;

    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, session, sessionStartTime]);

  const loadPracticeSession = async () => {
    try {
      setLoading(true);
      const result = await practiceAPI.getPracticeSession(sessionId);

      if (result.success) {
        setSession(result.data.session);
        setDeck(result.data.deck);
        setSessionStartTime(new Date(result.data.session.startedAt).getTime());
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

    setAttempts((prev) => {
      const newAttempts = [...prev, attempt];
      console.log(`🎯 Card ${currentCardIndex + 1} result recorded:`, {
        cardId: currentCard.id,
        isCorrect,
        totalAttempts: newAttempts.length,
        currentCardIndex: currentCardIndex + 1,
      });
      return newAttempts;
    });

    // Move to next card immediately (don't wait for server)
    if (currentCardIndex < deck.flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);

      // Record attempt on server in background (fire and forget) for non-final cards
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
      console.log(
        `🏁 Session completing with ${
          attempts.length + 1
        } total attempts (including this final card)`
      );

      // For the final card, wait for the server recording to complete
      try {
        await practiceAPI.recordFlashcardAttempt(
          sessionId,
          currentCard.id,
          isCorrect,
          responseTime
        );
        console.log("✅ Final card recorded successfully");
      } catch (error) {
        console.error("❌ Failed to record final card attempt:", error);
      }

      // Small delay to ensure background processing completes
      setTimeout(async () => {
        await completeSession();
      }, 200);
      return;
    }
  };

  const completeSession = async () => {
    if (!session || !deck) return;

    const cardsStudied = attempts.length;
    const cardsCorrect = attempts.filter((a) => a.isCorrect).length;
    const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    console.log(`📊 Completing session with local counts:`, {
      attemptsArrayLength: attempts.length,
      cardsStudied,
      cardsCorrect,
      currentCardIndex,
      totalCardsInDeck: deck.flashcards.length,
    });

    try {
      const result = await practiceAPI.completePracticeSession(
        sessionId,
        cardsStudied,
        cardsCorrect,
        totalTimeSeconds
      );

      if (result.success) {
        // Use the actual counts returned from the server (database-verified)
        const actualCardsStudied = result.data.session.cardsStudied;
        const actualCardsCorrect = result.data.session.cardsCorrect;
        const actualTotalTime = result.data.session.totalTimeSeconds;

        console.log(`✅ Server verified counts:`, {
          client: { cardsStudied, cardsCorrect },
          server: {
            cardsStudied: actualCardsStudied,
            cardsCorrect: actualCardsCorrect,
          },
          difference: {
            cardsStudied: actualCardsStudied - cardsStudied,
            cardsCorrect: actualCardsCorrect - cardsCorrect,
          },
        });

        // Navigate to summary with server-verified data
        router.push(
          `/practice/${sessionId}/summary?cardsStudied=${actualCardsStudied}&cardsCorrect=${actualCardsCorrect}&totalTime=${actualTotalTime}`
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
    setIsPaused(!isPaused);
  };

  const handleQuit = () => {
    setShowQuitDialog(true);
  };

  const confirmQuit = async () => {
    if (!session) return;

    const cardsStudied = attempts.length;
    const cardsCorrect = attempts.filter((a) => a.isCorrect).length;
    const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center py-20">
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading practice session...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!session || !deck) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center py-20">
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-600 mb-4" />
              <p className="text-gray-900 font-medium mb-2">
                Session not found
              </p>
              <p className="text-gray-600 text-center mb-4">
                The practice session could not be loaded.
              </p>
              <Button onClick={() => router.push("/assistant")}>
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
    <div className="min-h-screen bg-gray-50">
      <Header />

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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {deck.title}
            </h1>
            <p className="text-gray-600">
              Practice Session • {deck.flashcards.length} cards
            </p>
          </div>

          {/* Practice Card */}
          {currentCard && (
            <PracticeCard
              flashcard={currentCard}
              onResult={handleCardResult}
              disabled={isPaused}
            />
          )}

          {/* Pause Overlay */}
          {isPaused && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-96">
                <CardContent className="text-center py-8">
                  <h3 className="text-xl font-semibold mb-4">Session Paused</h3>
                  <p className="text-gray-600 mb-6">
                    Take your time. Click resume when you're ready to continue.
                  </p>
                  <Button
                    onClick={handlePause}
                    className="bg-blue-600 hover:bg-blue-700"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quit Practice Session?</DialogTitle>
            <DialogDescription>
              Your progress will be saved, but you'll need to start a new
              session to continue practicing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowQuitDialog(false)}
              className="flex-1"
            >
              Continue Practicing
            </Button>
            <Button
              onClick={confirmQuit}
              variant="destructive"
              className="flex-1"
            >
              Quit Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
