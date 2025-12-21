"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";

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

interface PracticeCardProps {
  flashcard: Flashcard;
  onResult: (isCorrect: boolean, responseTime: number) => void;
  showAnswer?: boolean;
  onFlip?: () => void;
  disabled?: boolean;
}

export default function PracticeCard({
  flashcard,
  onResult,
  showAnswer = false,
  onFlip,
  disabled = false,
}: PracticeCardProps) {
  const [isFlipped, setIsFlipped] = useState(showAnswer);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [answerGiven, setAnswerGiven] = useState<boolean | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);

  useEffect(() => {
    setIsFlipped(showAnswer);
    setSelectedOption(null);
    setShowResult(false);
    setAnswerGiven(null);
    setShowNextButton(false);
    setStartTime(Date.now());
  }, [flashcard.id, showAnswer]);

  const handleFlip = () => {
    if (disabled) return;

    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);

    if (onFlip) {
      onFlip();
    }
  };

  const handleResult = (isCorrect: boolean) => {
    if (disabled || answerGiven !== null) return;

    const responseTime = (Date.now() - startTime) / 1000;
    setAnswerGiven(isCorrect);
    setShowNextButton(true);
    // Don't call onResult immediately - wait for Next button click
  };

  const handleNextCard = () => {
    if (answerGiven === null) return;

    const responseTime = (Date.now() - startTime) / 1000;
    onResult(answerGiven, responseTime);
  };

  const handleMultipleChoiceSelect = (optionId: number, isCorrect: boolean) => {
    if (disabled || showResult) return;

    setSelectedOption(optionId);
    setShowResult(true);
    setAnswerGiven(isCorrect);

    // For multiple choice, show result briefly then show Next button
    setTimeout(() => {
      setShowNextButton(true);
    }, 1500);
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
      case 5:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Very Easy";
      case 2:
        return "Easy";
      case 3:
        return "Medium";
      case 4:
        return "Hard";
      case 5:
        return "Very Hard";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="min-h-[400px] relative overflow-hidden">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Badge className={getDifficultyColor(flashcard.difficulty_level)}>
              {getDifficultyLabel(flashcard.difficulty_level)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {flashcard.card_type === "multiple_choice"
                ? "Multiple Choice"
                : "Basic"}
            </Badge>
          </div>

          {/* Question Side */}
          {!isFlipped && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {flashcard.question}
                </h2>
              </div>

              {/* Multiple Choice Options */}
              {flashcard.card_type === "multiple_choice" &&
                flashcard.flashcard_options.length > 0 && (
                  <div className="space-y-3">
                    {flashcard.flashcard_options.map((option) => (
                      <Button
                        key={option.id}
                        variant={
                          selectedOption === option.id ? "default" : "outline"
                        }
                        className={`w-full text-left justify-start p-4 h-auto ${
                          showResult
                            ? option.is_correct
                              ? "bg-green-100 border-green-500 text-green-800"
                              : selectedOption === option.id
                              ? "bg-red-100 border-red-500 text-red-800"
                              : ""
                            : ""
                        }`}
                        onClick={() =>
                          handleMultipleChoiceSelect(
                            option.id,
                            option.is_correct
                          )
                        }
                        disabled={disabled || showResult}
                      >
                        <span className="mr-3 font-medium">
                          {String.fromCharCode(65 + option.option_order)}
                        </span>
                        {option.option_text}
                        {showResult && option.is_correct && (
                          <CheckCircle className="w-5 h-5 ml-auto text-green-600" />
                        )}
                        {showResult &&
                          selectedOption === option.id &&
                          !option.is_correct && (
                            <XCircle className="w-5 h-5 ml-auto text-red-600" />
                          )}
                      </Button>
                    ))}

                    {/* Next Card Button for Multiple Choice - appears after selection */}
                    {showNextButton && (
                      <div className="text-center pt-4">
                        <Button
                          onClick={handleNextCard}
                          size="lg"
                          disabled={disabled}
                          className="px-8 bg-blue-600 hover:bg-blue-700"
                        >
                          Next Card →
                        </Button>
                      </div>
                    )}
                  </div>
                )}

              {/* Flip Button for Basic Cards */}
              {flashcard.card_type === "basic" && (
                <div className="text-center">
                  <Button
                    onClick={handleFlip}
                    variant="outline"
                    size="lg"
                    disabled={disabled}
                    className="px-8"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Show Answer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Answer Side */}
          {isFlipped && flashcard.card_type === "basic" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Answer:
                </h3>
                <p className="text-xl text-gray-900 mb-4">{flashcard.answer}</p>

                {flashcard.explanation && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Explanation:</strong> {flashcard.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Result Buttons */}
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={() => handleResult(false)}
                  variant="outline"
                  size="lg"
                  disabled={disabled || answerGiven !== null}
                  className={`px-8 border-red-300 text-red-700 hover:bg-red-50 ${
                    answerGiven === false ? "bg-red-100 border-red-500" : ""
                  }`}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleResult(true)}
                  size="lg"
                  disabled={disabled || answerGiven !== null}
                  className={`px-8 bg-green-600 hover:bg-green-700 ${
                    answerGiven === true ? "bg-green-700" : ""
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Correct
                </Button>
              </div>

              {/* Next Card Button - appears after marking correct/incorrect */}
              {showNextButton && (
                <div className="text-center">
                  <Button
                    onClick={handleNextCard}
                    size="lg"
                    disabled={disabled}
                    className="px-8 bg-blue-600 hover:bg-blue-700"
                  >
                    Next Card →
                  </Button>
                </div>
              )}

              {/* Hide Answer Button */}
              <div className="text-center">
                <Button
                  onClick={handleFlip}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Answer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
