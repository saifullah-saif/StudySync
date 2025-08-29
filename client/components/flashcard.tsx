"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface FlashcardProps {
  question: string;
  answer: string;
  cardNumber: number;
  totalCards: number;
  onMarkRight: () => void;
  onMarkWrong: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isLastCard?: boolean;
  isFirstCard?: boolean;
}

export default function Flashcard({
  question,
  answer,
  cardNumber,
  totalCards,
  onMarkRight,
  onMarkWrong,
  onNext,
  onPrevious,
  isLastCard = false,
  isFirstCard = false,
}: FlashcardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleMarkRight = () => {
    setIsAnswered(true);
    onMarkRight();
    // Auto advance after a brief delay
    setTimeout(() => {
      if (!isLastCard) {
        handleNext();
      }
    }, 1000);
  };

  const handleMarkWrong = () => {
    setIsAnswered(true);
    onMarkWrong();
    // Auto advance after a brief delay
    setTimeout(() => {
      if (!isLastCard) {
        handleNext();
      }
    }, 1000);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setIsAnswered(false);
    onNext();
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setIsAnswered(false);
    onPrevious();
  };

  const handleQuit = () => {
    // Navigate back or close flashcards
    window.history.back();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Main Flashcard */}
        <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center min-h-[400px] flex flex-col justify-center">
            {!showAnswer ? (
              <>
                {/* Question Side */}
                <h2 className="text-2xl font-medium text-blue-600 mb-12 leading-relaxed">
                  {question}
                </h2>

                <div className="flex justify-center gap-6">
                  <Button
                    onClick={handleQuit}
                    variant="outline"
                    className="px-8 py-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200 font-medium"
                  >
                    QUIT
                  </Button>
                  <Button
                    onClick={handleShowAnswer}
                    className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    SHOW ANSWER
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Answer Side */}
                <div className="text-xl text-blue-600 mb-8 leading-relaxed">
                  {answer}
                </div>

                <div className="flex justify-center gap-6">
                  <Button
                    onClick={handleMarkRight}
                    disabled={isAnswered}
                    className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-medium flex items-center gap-2"
                  >
                    <Check size={18} />
                    Mark right
                  </Button>
                  <Button
                    onClick={handleMarkWrong}
                    disabled={isAnswered}
                    className="px-8 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2"
                  >
                    <X size={18} />
                    Mark wrong
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Counter */}
        <div className="text-center mt-6">
          <span className="text-gray-600 font-medium">
            Card {cardNumber} of {totalCards}
          </span>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrevious}
            disabled={isFirstCard}
            variant="outline"
            className="px-6 py-2 rounded-full"
          >
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLastCard}
            variant="outline"
            className="px-6 py-2 rounded-full"
          >
            {isLastCard ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
