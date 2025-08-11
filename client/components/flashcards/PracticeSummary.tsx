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
  XCircle
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
    if (accuracy >= 90) return "text-green-600";
    if (accuracy >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 90) return "bg-green-100 text-green-800";
    if (accuracy >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      // Create new practice session
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
      // Default export as JSON
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Complete!
        </h1>
        <p className="text-gray-600">
          Great job studying <strong>{deckTitle}</strong>
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {cardsStudied}
            </div>
            <div className="text-sm text-gray-600">Cards Studied</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${getAccuracyColor(accuracy)}`}>
              {accuracy}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatTime(totalTimeSeconds)}
            </div>
            <div className="text-sm text-gray-600">Total Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatTime(avgTimePerCard)}
            </div>
            <div className="text-sm text-gray-600">Avg per Card</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Session Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Accuracy Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Accuracy</span>
              <Badge className={getAccuracyBadgeColor(accuracy)}>
                {accuracy}%
              </Badge>
            </div>
            <Progress value={accuracy} className="h-2" />
          </div>

          {/* Correct vs Incorrect */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">
                <strong>{cardsCorrect}</strong> correct
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm">
                <strong>{cardsIncorrect}</strong> incorrect
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missed Cards */}
      {missedCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cards to Review ({missedCards.length})</span>
              <Badge variant="outline" className="text-red-600">
                Needs Practice
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missedCards.map((card) => (
                <div
                  key={card.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">
                        {card.question}
                      </p>
                      <p className="text-sm text-gray-600">
                        {card.answer}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <Button size="sm" variant="outline">
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleRestart}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Practice Again
        </Button>
        
        <Button
          onClick={handleViewDeck}
          variant="outline"
          size="lg"
        >
          <Eye className="w-5 h-5 mr-2" />
          View Deck
        </Button>
        
        <Button
          onClick={handleExportSummary}
          variant="outline"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Summary
        </Button>
      </div>
    </div>
  );
}
