"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudyFlashcards, { StudyFlashcard } from "@/components/StudyFlashcards";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Home } from "lucide-react";

export default function FlashcardsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<StudyFlashcard[] | null>(null);
  const [title, setTitle] = useState<string>("Flashcards");
  const [fileId, setFileId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const raw = sessionStorage.getItem("currentFlashcards");
      if (!raw) {
        setCards([]);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(raw);

      // Handle different data structures
      let deck = parsed.flashcards || parsed.qsAns || parsed;

      // Convert Q&A format to flashcard format if needed
      if (parsed.qsAns && Array.isArray(parsed.qsAns)) {
        deck = parsed.qsAns.map((item: any, index: number) => ({
          id: `card-${index + 1}`,
          question: item.question,
          answer: item.answer,
          shownAnswer: false,
          result: null,
        }));
      }

      setTitle(parsed.title || "Generated Flashcards");
      setFileId(parsed.fileId || null);
      setCards(
        (deck || []).map((c: any, i: number) => ({
          id: c.id ?? String(i + 1),
          question: c.question ?? c.q ?? "",
          answer: c.answer ?? c.a ?? "",
          shownAnswer: false,
          result: null,
        }))
      );
    } catch (err) {
      console.error("Failed to load flashcards from sessionStorage", err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
            <p className="text-gray-600 mt-4">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />

        {/* Empty State */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No Flashcards Found
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Generate flashcards from a PDF file first.
            </p>
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
    <div>
      <StudyFlashcards
        flashcards={cards}
        title={title}
        onQuit={handleQuit}
        onFinish={handleFinish}
      />
    </div>
  );
}
