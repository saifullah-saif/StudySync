"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { documentAPI, practiceAPI } from "@/lib/api";
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

interface Deck {
  id: number;
  title: string;
  description: string;
  creation_method: string;
  created_at: string;
  flashcards: Flashcard[];
}

export default function DeckViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated first
      if (!user) {
        toast.error("Please log in to view flashcard decks");
        router.push("/");
        return;
      }
      
      const result = await documentAPI.getDeck(parseInt(deckId));

      if (result.success) {
        setDeck(result.data); // Changed from result.deck to result.data
      } else {
        toast.error(result.message || "Failed to load flashcard deck");
        router.push("/assistant");
      }
    } catch (error: any) {
      console.error("Load deck error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Please log in to view flashcard decks");
        router.push("/");
      } else if (error.response?.status === 404) {
        toast.error("Flashcard deck not found");
        router.push("/assistant");
      } else {
        toast.error("Failed to load flashcard deck");
        router.push("/assistant");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    if (!deck) return;

    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to start a practice session");
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    try {
      const result = await practiceAPI.createPracticeSession(deck.id);
      if (result.success) {
        router.push(`/practice/${result.data.sessionId}`);
      } else {
        toast.error(result.message || "Failed to start practice session");
      }
    } catch (error: any) {
      console.error("Practice session error:", error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error("Please log in to start a practice session");
        router.push(
          "/auth?redirect=" + encodeURIComponent(window.location.pathname)
        );
      } else {
        toast.error("Failed to start practice session");
      }
    }
  };

  const currentCard = deck?.flashcards[currentCardIndex];

  const nextCard = () => {
    if (!deck || currentCardIndex >= deck.flashcards.length - 1) return;

    setCurrentCardIndex(currentCardIndex + 1);
    setShowAnswer(false);
    setSelectedOption(null);
    setShowResult(false);
  };

  const prevCard = () => {
    if (currentCardIndex <= 0) return;

    setCurrentCardIndex(currentCardIndex - 1);
    setShowAnswer(false);
    setSelectedOption(null);
    setShowResult(false);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (showResult) return;

    setSelectedOption(optionIndex);
    setShowResult(true);
  };

  const resetDeck = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setSelectedOption(null);
    setShowResult(false);
    setStudyMode(false);
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-yellow-100 text-yellow-800";
      case 3:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1:
        return "Easy";
      case 2:
        return "Medium";
      case 3:
        return "Hard";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading flashcard deck...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">Deck not found</p>
            <Button onClick={() => router.push("/assistant")} className="mt-4">
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/assistant")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{deck.title}</h1>
              <p className="text-gray-600">{deck.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline">{deck.flashcards.length} cards</Badge>
            <Badge variant="outline">AI Generated</Badge>
          </div>
        </div>

        {!studyMode ? (
          /* Overview Mode */
          <div className="space-y-6">
            {/* Study Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Ready to study?
                    </h3>
                    <p className="text-gray-600">
                      Practice with {deck.flashcards.length} flashcards
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleStartPractice}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {user ? "Start Practice Session" : "Login to Practice"}
                    </Button>
                    <Button
                      onClick={() => setStudyMode(true)}
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Browse Cards
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards Overview */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">All Flashcards</h3>
              {deck.flashcards.map((card, index) => (
                <Card
                  key={card.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <Badge
                            className={getDifficultyColor(
                              card.difficulty_level
                            )}
                          >
                            {getDifficultyText(card.difficulty_level)}
                          </Badge>
                          <Badge variant="outline">
                            {card.card_type.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Question
                            </h4>
                            <p className="text-gray-700">{card.question}</p>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Answer
                            </h4>
                            {card.card_type === "mcq" &&
                            card.flashcard_options.length > 0 ? (
                              <div className="space-y-2">
                                {card.flashcard_options
                                  .sort(
                                    (a, b) => a.option_order - b.option_order
                                  )
                                  .map((option, optIndex) => (
                                    <div
                                      key={option.id}
                                      className={`p-3 rounded-lg border ${
                                        option.is_correct
                                          ? "border-green-300 bg-green-50"
                                          : "border-gray-200 bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>
                                          {String.fromCharCode(65 + optIndex)}.{" "}
                                          {option.option_text}
                                        </span>
                                        {option.is_correct && (
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-gray-700">{card.answer}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Study Mode */
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStudyMode(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit Study Mode
                </Button>
                <Badge variant="outline">
                  {currentCardIndex + 1} of {deck.flashcards.length}
                </Badge>
              </div>

              <Button variant="outline" size="sm" onClick={resetDeck}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((currentCardIndex + 1) / deck.flashcards.length) * 100
                  }%`,
                }}
              ></div>
            </div>

            {/* Flashcard */}
            {currentCard && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Question {currentCardIndex + 1}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge
                        className={getDifficultyColor(
                          currentCard.difficulty_level
                        )}
                      >
                        {getDifficultyText(currentCard.difficulty_level)}
                      </Badge>
                      <Badge variant="outline">
                        {currentCard.card_type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Question */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        Question
                      </h3>
                      <p className="text-lg text-gray-700">
                        {currentCard.question}
                      </p>
                    </div>

                    {/* MCQ Options or Answer */}
                    {currentCard.card_type === "mcq" &&
                    currentCard.flashcard_options.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">
                          Choose the correct answer:
                        </h3>
                        <div className="space-y-3">
                          {currentCard.flashcard_options
                            .sort((a, b) => a.option_order - b.option_order)
                            .map((option, optIndex) => (
                              <button
                                key={option.id}
                                onClick={() => handleOptionSelect(optIndex)}
                                disabled={showResult}
                                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                                  selectedOption === optIndex
                                    ? showResult
                                      ? option.is_correct
                                        ? "border-green-500 bg-green-50"
                                        : "border-red-500 bg-red-50"
                                      : "border-blue-500 bg-blue-50"
                                    : showResult && option.is_correct
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>
                                    <strong>
                                      {String.fromCharCode(65 + optIndex)}.
                                    </strong>{" "}
                                    {option.option_text}
                                  </span>
                                  {showResult && (
                                    <>
                                      {option.is_correct && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      )}
                                      {selectedOption === optIndex &&
                                        !option.is_correct && (
                                          <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </>
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>

                        {showResult && (
                          <div
                            className={`p-4 rounded-lg ${
                              currentCard.flashcard_options[selectedOption || 0]
                                ?.is_correct
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <p className="font-medium">
                              {currentCard.flashcard_options[
                                selectedOption || 0
                              ]?.is_correct
                                ? "✅ Correct!"
                                : "❌ Incorrect"}
                            </p>
                            {!currentCard.flashcard_options[selectedOption || 0]
                              ?.is_correct && (
                              <p className="mt-2">
                                The correct answer is:{" "}
                                <strong>
                                  {String.fromCharCode(
                                    65 +
                                      currentCard.flashcard_options.findIndex(
                                        (opt) => opt.is_correct
                                      )
                                  )}
                                </strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">Answer</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAnswer}
                          >
                            {showAnswer ? (
                              <EyeOff className="w-4 h-4 mr-2" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            {showAnswer ? "Hide" : "Show"} Answer
                          </Button>
                        </div>

                        {showAnswer && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-gray-700">
                              {currentCard.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={prevCard}
                disabled={currentCardIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={nextCard}
                disabled={currentCardIndex >= deck.flashcards.length - 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            </div>

            {currentCardIndex === deck.flashcards.length - 1 && (
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  🎉 Great job!
                </h3>
                <p className="text-gray-600 mb-4">
                  You've completed all the flashcards in this deck.
                </p>
                <Button
                  onClick={resetDeck}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Study Again
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
