"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header";
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
  completedAt?: string;
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

        // Calculate missed cards (this is a simplified version)
        // In a real implementation, you'd track which specific cards were missed
        const missed = result.data.deck.flashcards.slice(
          0,
          result.data.session.cardsStudied - result.data.session.cardsCorrect
        );
        setMissedCards(missed);
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
      completedAt: session.completedAt || new Date().toISOString(),
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center py-20">
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading practice summary...</p>
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
                The practice session summary could not be loaded.
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

  // Use URL params for immediate display if session data isn't loaded yet
  const displayCardsStudied =
    session.cardsStudied || parseInt(urlCardsStudied || "0");
  const displayCardsCorrect =
    session.cardsCorrect || parseInt(urlCardsCorrect || "0");
  const displayTotalTime =
    session.totalTimeSeconds || parseInt(urlTotalTime || "0");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
