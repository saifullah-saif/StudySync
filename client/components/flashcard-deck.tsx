"use client";

import { useState, useEffect } from "react";
import Flashcard from "./flashcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, RotateCcw, ArrowLeft } from "lucide-react";

interface FlashcardData {
  question: string;
  answer: string;
  type?: string;
}

interface FlashcardDeckProps {
  flashcards: FlashcardData[];
  title: string;
  onBack: () => void;
}

export default function FlashcardDeck({
  flashcards,
  title,
  onBack,
}: FlashcardDeckProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [completedCards, setCompletedCards] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = flashcards[currentCardIndex];
  const totalCards = flashcards.length;

  useEffect(() => {
    if (completedCards.length === totalCards && totalCards > 0) {
      setIsComplete(true);
    }
  }, [completedCards, totalCards]);

  const handleMarkRight = () => {
    setCorrectAnswers((prev) => prev + 1);
    if (!completedCards.includes(currentCardIndex)) {
      setCompletedCards((prev) => [...prev, currentCardIndex]);
    }
  };

  const handleMarkWrong = () => {
    setWrongAnswers((prev) => prev + 1);
    if (!completedCards.includes(currentCardIndex)) {
      setCompletedCards((prev) => [...prev, currentCardIndex]);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setCompletedCards([]);
    setIsComplete(false);
  };

  const accuracy =
    totalCards > 0
      ? Math.round((correctAnswers / (correctAnswers + wrongAnswers)) * 100)
      : 0;

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-medium text-gray-600 mb-6">
              No flashcards available
            </h2>
            <p className="text-gray-500 mb-8">
              Generate some flashcards first to start studying!
            </p>
            <Button
              onClick={onBack}
              variant="outline"
              className="px-8 py-3 rounded-full"
            >
              <ArrowLeft className="mr-2" size={18} />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Congratulations! 🎉
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              You've completed all {totalCards} flashcards!
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {correctAnswers}
                </div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {wrongAnswers}
                </div>
                <div className="text-sm text-gray-500">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {accuracy}%
                </div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleRestart}
                className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
              >
                <RotateCcw size={18} />
                Study Again
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="px-8 py-3 rounded-full flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back to Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">
              {title} - Flashcards
            </h1>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-green-600">✓ {correctAnswers} correct</div>
            <div className="text-red-600">✗ {wrongAnswers} wrong</div>
            <div className="text-gray-600">
              {completedCards.length}/{totalCards} completed
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <Flashcard
        question={currentCard.question}
        answer={currentCard.answer}
        cardNumber={currentCardIndex + 1}
        totalCards={totalCards}
        onMarkRight={handleMarkRight}
        onMarkWrong={handleMarkWrong}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isFirstCard={currentCardIndex === 0}
        isLastCard={currentCardIndex === totalCards - 1}
      />
    </div>
  );
}
