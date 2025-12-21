"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, Play } from "lucide-react";
import { flashcardAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

interface FlashcardPair {
  id: string;
  question: string;
  answer: string;
}

export default function ManualFlashcardCreator() {
  const router = useRouter();
  const [deckTitle, setDeckTitle] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardPair[]>([
    { id: "1", question: "", answer: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [startingPractice, setStartingPractice] = useState(false);

  const addFlashcard = () => {
    const newId = String(Date.now());
    setFlashcards([...flashcards, { id: newId, question: "", answer: "" }]);
  };

  const removeFlashcard = (id: string) => {
    if (flashcards.length === 1) {
      toast.error("You need at least one flashcard");
      return;
    }
    setFlashcards(flashcards.filter((card) => card.id !== id));
  };

  const updateFlashcard = (
    id: string,
    field: "question" | "answer",
    value: string
  ) => {
    setFlashcards(
      flashcards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const validateFlashcards = () => {
    if (!deckTitle.trim()) {
      toast.error("Please enter a deck title");
      return false;
    }

    const validCards = flashcards.filter(
      (card) => card.question.trim() && card.answer.trim()
    );

    if (validCards.length === 0) {
      toast.error("Please create at least one complete flashcard");
      return false;
    }

    return true;
  };

  const saveDeck = async () => {
    if (!validateFlashcards()) return;

    setSaving(true);
    try {
      const validCards = flashcards.filter(
        (card) => card.question.trim() && card.answer.trim()
      );

      const qsAns = validCards.map((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
      }));

      console.log("Sending flashcard data:", {
        qsAns,
        title: deckTitle.trim(),
        sourceFileId: null,
        count: validCards.length,
      });

      const result = await flashcardAPI.generateFlashcards(
        qsAns,
        deckTitle.trim(),
        null // sourceFileId - null for manual decks
      );

      if (result.success) {
        toast.success(
          `Deck "${deckTitle}" saved successfully with ${validCards.length} flashcards!`
        );

        // Reset form
        setDeckTitle("");
        setFlashcards([{ id: "1", question: "", answer: "" }]);

        return result.data.deckId;
      } else {
        throw new Error(result.message || "Failed to save deck");
      }
    } catch (error: any) {
      console.error("Error saving deck:", error);
      toast.error(error.message || "Failed to save deck");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveAndPractice = async () => {
    if (!validateFlashcards()) return;

    setStartingPractice(true);
    try {
      const deckId = await saveDeck();

      if (deckId) {
        // Create practice session for the newly created deck
        const sessionResult = await flashcardAPI.createPracticeSession(
          deckId,
          "all_cards"
        );

        if (sessionResult?.success && sessionResult.data?.sessionId) {
          // Redirect to practice session using the modern UI
          router.push(`/practice/${sessionResult.data.sessionId}`);
        } else {
          throw new Error(
            sessionResult?.message || "Failed to create practice session"
          );
        }
      }
    } catch (error: any) {
      console.error("Error starting practice:", error);
      toast.error(error.message || "Failed to start practice session");
    } finally {
      setStartingPractice(false);
    }
  };

  const validCardsCount = flashcards.filter(
    (card) => card.question.trim() && card.answer.trim()
  ).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Create Flashcards Manually
        </h1>
        <p className="text-slate-600">
          Create your own flashcard deck by adding question and answer pairs
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Deck Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deckTitle">Deck Title</Label>
              <Input
                id="deckTitle"
                placeholder="Enter a title for your flashcard deck..."
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {flashcards.length} cards total • {validCardsCount} complete
              </div>
              <Button
                onClick={addFlashcard}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 mb-6">
        {flashcards.map((card, index) => (
          <Card key={card.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Card {index + 1}</CardTitle>
                {flashcards.length > 1 && (
                  <Button
                    onClick={() => removeFlashcard(card.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`question-${card.id}`}>Question</Label>
                <Textarea
                  id={`question-${card.id}`}
                  placeholder="Enter your question..."
                  value={card.question}
                  onChange={(e) =>
                    updateFlashcard(card.id, "question", e.target.value)
                  }
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor={`answer-${card.id}`}>Answer</Label>
                <Textarea
                  id={`answer-${card.id}`}
                  placeholder="Enter the answer..."
                  value={card.answer}
                  onChange={(e) =>
                    updateFlashcard(card.id, "answer", e.target.value)
                  }
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          onClick={saveDeck}
          disabled={saving || validCardsCount === 0 || !deckTitle.trim()}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Deck"}
        </Button>

        <Button
          onClick={saveAndPractice}
          disabled={
            startingPractice ||
            saving ||
            validCardsCount === 0 ||
            !deckTitle.trim()
          }
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Play className="h-4 w-4" />
          {startingPractice ? "Starting..." : "Save & Practice"}
        </Button>
      </div>

      {validCardsCount > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            💡 Tip: You can save your deck to practice later, or save and start
            practicing immediately!
          </p>
        </div>
      )}
    </div>
  );
}
