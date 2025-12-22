"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PracticeSummary from "@/components/flashcards/PracticeSummary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

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
  flashcards: Array<{
    id: number;
    question: string;
    answer: string;
    difficulty_level: number;
  }>;
}

interface MissedCard {
  id: number;
  question: string;
  answer: string;
  difficulty_level: number;
}

export default function PracticeSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const sessionId = parseInt(params.sessionId as string);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [missedCards, setMissedCards] = useState<MissedCard[]>([]);

  // Get data from URL params if available (for immediate display)
  const urlCardsStudied = searchParams.get("cardsStudied");
  const urlCardsCorrect = searchParams.get("cardsCorrect");
  const urlTotalTime = searchParams.get("totalTime");

  useEffect(() => {
    if (!user) {
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    loadPracticeSession();
  }, [sessionId, user]);

  const loadPracticeSession = async () => {
    try {
      setLoading(true);
      const result = await practiceAPI.getPracticeSession(sessionId);

      if (result.success) {
        setSession(result.data.session);
        setDeck(result.data.deck);

        // FIX: Use actual missed cards from the API response
        // The backend now returns the cards that were actually answered incorrectly
        if (result.data.missedCards && Array.isArray(result.data.missedCards)) {
          setMissedCards(result.data.missedCards);
          console.log(`✅ Loaded ${result.data.missedCards.length} actual missed cards from database`);
        } else {
          setMissedCards([]);
        }
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

  const handleRestart = async () => {
    if (!deck) return;

    try {
      const result = await practiceAPI.createPracticeSession(deck.id);
      if (result.success) {
        router.push(`/practice/${result.data.sessionId}`);
      } else {
        toast.error(result.message || "Failed to start new practice session");
      }
    } catch (error) {
      console.error("Restart practice error:", error);
      toast.error("Failed to start new practice session");
    }
  };

  const handleViewDeck = () => {
    if (deck) {
      router.push(`/flashcards/deck/${deck.id}`);
    }
  };

  const handleExportSummary = () => {
    if (!session || !deck) return;

    const summaryData = {
      sessionId: session.id,
      deckId: session.deckId,
      deckTitle: deck.title,
      cardsStudied: session.cardsStudied,
      cardsCorrect: session.cardsCorrect,
      accuracy:
        session.cardsStudied > 0
          ? Math.round((session.cardsCorrect / session.cardsStudied) * 100)
          : 0,
      totalTimeSeconds: session.totalTimeSeconds,
      avgTimePerCard:
        session.cardsStudied > 0
          ? Math.round(session.totalTimeSeconds / session.cardsStudied)
          : 0,
      missedCards,
      completedAt: session.endedAt || new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `practice-summary-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Summary exported successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <main className="flex items-center justify-center py-20">
          <Card className="w-96 border-none shadow-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Loader2 className="relative w-12 h-12 animate-spin text-blue-600" />
              </div>
              <p className="text-gray-700 font-medium">Loading practice summary...</p>
              <p className="text-gray-500 text-sm mt-2">Analyzing your performance</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!session || !deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <main className="flex items-center justify-center py-20">
          <Card className="w-96 border-none shadow-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 font-bold text-xl mb-2">
                Session not found
              </p>
              <p className="text-gray-600 text-center mb-6 px-4">
                The practice session summary could not be loaded.
              </p>
              <Button
                onClick={() => router.push("/assistant")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Use URL params for immediate display if session data isn't loaded yet
  const displayCardsStudied =
    session?.cardsStudied ?? parseInt(urlCardsStudied || "0");
  const displayCardsCorrect =
    session?.cardsCorrect ?? parseInt(urlCardsCorrect || "0");
  const displayTotalTime =
    session?.totalTimeSeconds ?? parseInt(urlTotalTime || "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <main className="py-8">
        <PracticeSummary
          sessionId={session.id}
          deckId={session.deckId}
          deckTitle={deck.title}
          cardsStudied={displayCardsStudied}
          cardsCorrect={displayCardsCorrect}
          totalTimeSeconds={displayTotalTime}
          missedCards={missedCards}
          onRestart={handleRestart}
          onViewDeck={handleViewDeck}
          onExportSummary={handleExportSummary}
        />
      </main>
    </div>
  );
}
