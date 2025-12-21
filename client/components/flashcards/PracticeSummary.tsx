"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Clock,
  Target,
  RotateCcw,
  Download,
  Eye,
  Edit,
  TrendingUp,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Award
} from "lucide-react";

interface MissedCard {
  id: number;
  question: string;
  answer: string;
  difficulty_level: number;
}

interface PracticeSummaryProps {
  sessionId: number;
  deckId: number;
  deckTitle: string;
  cardsStudied: number;
  cardsCorrect: number;
  totalTimeSeconds: number;
  missedCards?: MissedCard[];
  onRestart?: () => void;
  onViewDeck?: () => void;
  onExportSummary?: () => void;
}

export default function PracticeSummary({
  sessionId,
  deckId,
  deckTitle,
  cardsStudied,
  cardsCorrect,
  totalTimeSeconds,
  missedCards = [],
  onRestart,
  onViewDeck,
  onExportSummary,
}: PracticeSummaryProps) {
  const router = useRouter();

  const accuracy = cardsStudied > 0 ? Math.round((cardsCorrect / cardsStudied) * 100) : 0;
  const avgTimePerCard = cardsStudied > 0 ? Math.round(totalTimeSeconds / cardsStudied) : 0;
  const cardsIncorrect = cardsStudied - cardsCorrect;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "from-green-500 to-green-600";
    if (accuracy >= 70) return "from-yellow-500 to-yellow-600";
    return "from-red-500 to-red-600";
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 90) return "bg-gradient-to-r from-green-500 to-green-600 text-white";
    if (accuracy >= 70) return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
    return "bg-gradient-to-r from-red-500 to-red-600 text-white";
  };

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return "Outstanding! 🌟";
    if (accuracy >= 80) return "Great job! 🎉";
    if (accuracy >= 70) return "Good work! 👍";
    if (accuracy >= 60) return "Keep practicing! 💪";
    return "Don't give up! 🚀";
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      router.push(`/flashcards/deck/${deckId}`);
    }
  };

  const handleViewDeck = () => {
    if (onViewDeck) {
      onViewDeck();
    } else {
      router.push(`/flashcards/deck/${deckId}`);
    }
  };

  const handleExportSummary = () => {
    if (onExportSummary) {
      onExportSummary();
    } else {
      const summaryData = {
        sessionId,
        deckId,
        deckTitle,
        cardsStudied,
        cardsCorrect,
        accuracy,
        totalTimeSeconds,
        avgTimePerCard,
        missedCards,
        completedAt: new Date().toISOString(),
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
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header with Trophy Animation */}
      <div className="text-center">
        <div className="flex justify-center mb-6 animate-in zoom-in duration-700 delay-100">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 animate-in slide-in-from-bottom duration-500 delay-200">
          Practice Complete!
        </h1>
        <p className="text-lg text-gray-700 animate-in slide-in-from-bottom duration-500 delay-300">
          {getPerformanceMessage(accuracy)} You studied <strong className="text-blue-600">{deckTitle}</strong>
        </p>
      </div>

      {/* Main Stats Cards with Gradient Backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-500 delay-400">
        {/* Cards Studied */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <Badge className="bg-blue-600 text-white">Total</Badge>
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-1">
              {cardsStudied}
            </div>
            <div className="text-sm text-blue-700 font-medium">Cards Studied</div>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-purple-600" />
              <Badge className={getAccuracyBadgeColor(accuracy)}>{accuracy}%</Badge>
            </div>
            <div className={`text-4xl font-bold mb-1 bg-gradient-to-r ${getAccuracyColor(accuracy)} bg-clip-text text-transparent`}>
              {accuracy}%
            </div>
            <div className="text-sm text-purple-700 font-medium">Accuracy</div>
          </CardContent>
        </Card>

        {/* Total Time */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-green-600" />
              <Badge className="bg-green-600 text-white">Time</Badge>
            </div>
            <div className="text-4xl font-bold text-green-900 mb-1 font-mono">
              {formatTime(totalTimeSeconds)}
            </div>
            <div className="text-sm text-green-700 font-medium">Total Time</div>
          </CardContent>
        </Card>

        {/* Average per Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-6 h-6 text-orange-600" />
              <Badge className="bg-orange-600 text-white">Avg</Badge>
            </div>
            <div className="text-4xl font-bold text-orange-900 mb-1 font-mono">
              {formatTime(avgTimePerCard)}
            </div>
            <div className="text-sm text-orange-700 font-medium">Per Card</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats with Enhanced Progress Bar */}
      <Card className="border-none shadow-lg animate-in slide-in-from-bottom duration-500 delay-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Session Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Accuracy Progress with Gradient */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Overall Accuracy</span>
              <Badge className={`${getAccuracyBadgeColor(accuracy)} px-4 py-1.5 text-base shadow-md`}>
                {accuracy}%
              </Badge>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${getAccuracyColor(accuracy)} transition-all duration-1000 ease-out relative`}
                style={{ width: `${accuracy}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Correct vs Incorrect with Enhanced Icons */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">{cardsCorrect}</div>
                <div className="text-sm text-green-700 font-medium">Correct</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <XCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-900">{cardsIncorrect}</div>
                <div className="text-sm text-red-700 font-medium">Incorrect</div>
              </div>
            </div>
          </div>

          {/* Performance Badge */}
          {accuracy >= 90 && (
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg animate-in zoom-in duration-500">
              <Award className="w-6 h-6 text-white mr-2" />
              <span className="text-white font-bold text-lg">Perfect Score Achievement!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missed Cards Section - FIXED to show actual missed cards */}
      {missedCards.length > 0 && (
        <Card className="border-none shadow-lg animate-in slide-in-from-bottom duration-500 delay-600">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="text-gray-900">Cards to Review ({missedCards.length})</span>
              </div>
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1.5 shadow-md">
                Needs Practice
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {missedCards.map((card, index) => (
                <div
                  key={card.id}
                  className="border-2 border-red-100 rounded-xl p-5 hover:bg-red-50/50 hover:border-red-200 transition-all duration-300 hover:shadow-md animate-in slide-in-from-left"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                          Difficulty: {card.difficulty_level}
                        </Badge>
                      </div>
                      <p className="font-semibold text-gray-900 mb-2 text-lg">
                        Q: {card.question}
                      </p>
                      <p className="text-gray-700 pl-4 border-l-4 border-blue-400">
                        A: {card.answer}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-purple-50 hover:border-purple-300">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons with Enhanced Styling */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-500 delay-700">
        <Button
          onClick={handleRestart}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          size="lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Practice Again
        </Button>

        <Button
          onClick={handleViewDeck}
          variant="outline"
          size="lg"
          className="border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Eye className="w-5 h-5 mr-2" />
          View Deck
        </Button>

        <Button
          onClick={handleExportSummary}
          variant="outline"
          size="lg"
          className="border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Summary
        </Button>
      </div>
    </div>
  );
}
