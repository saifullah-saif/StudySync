"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Loader2, Home } from "lucide-react";
import { flashcardAPI } from "@/lib/api";
import { toast } from "sonner";

export default function FlashcardsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPracticeSession = async () => {
      setLoading(true);
      try {
        const raw = sessionStorage.getItem("currentFlashcards");
        if (!raw) {
          setError("No flashcards found");
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(raw);

        // Handle different data structures
        let deck = parsed.flashcards || parsed.qsAns || parsed;

        // Convert Q&A format to flashcard format if needed
        if (parsed.qsAns && Array.isArray(parsed.qsAns)) {
          deck = parsed.qsAns.map((item: any, index: number) => ({
            question: item.question,
            answer: item.answer,
          }));
        }

        if (!deck || deck.length === 0) {
          setError("No valid flashcards found");
          setLoading(false);
          return;
        }

        // Save deck to database first
        const deckPayload = {
          title: parsed.title || "Generated Flashcards",
          sourceFileId: parsed.fileId ? Number(parsed.fileId) : null,
          qsAns: deck.map((c: any) => ({
            question: c.question ?? c.q ?? "",
            answer: c.answer ?? c.a ?? "",
          })),
        };

        console.log("Creating deck with payload:", deckPayload);
        const deckResult = await flashcardAPI.generateFlashcards(deckPayload);

        if (!deckResult?.success || !deckResult.data?.deckId) {
          throw new Error(deckResult?.message || "Failed to save deck");
        }

        const deckId = deckResult.data.deckId;
        console.log("Deck created with ID:", deckId);

        // Create practice session for the deck
        const sessionResult = await flashcardAPI.createPracticeSession(
          deckId,
          "all_cards"
        );

        if (!sessionResult?.success || !sessionResult.data?.sessionId) {
          throw new Error(
            sessionResult?.message || "Failed to create practice session"
          );
        }

        const sessionId = sessionResult.data.sessionId;
        console.log("Practice session created with ID:", sessionId);

        // Clear session storage since we've saved to database
        sessionStorage.removeItem("currentFlashcards");

        // Redirect to practice session
        router.push(`/practice/${sessionId}`);
      } catch (err: any) {
        console.error("Failed to create practice session:", err);
        setError(err.message || "Failed to start practice session");
        toast.error("Failed to start practice session");
      } finally {
        setLoading(false);
      }
    };

    createPracticeSession();
  }, [router]);

  const handleQuit = () => {
    router.push("/assistant/files");
  };

  const handleFinish = (summary: {
    total: number;
    correct: number;
    incorrect: number;
  }) => {
    console.log("Study session finished:", summary);
    // Could save stats to backend here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 mt-4">Creating practice session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />

        {/* Error State */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Failed to Start Practice
            </h2>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push("/assistant/files")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Files
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 mt-4">
            Redirecting to practice session...
          </p>
        </div>
      </div>
    </div>
  );
}