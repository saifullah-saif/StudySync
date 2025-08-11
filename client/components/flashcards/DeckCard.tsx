"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";
import { practiceAPI } from "@/lib/api";

interface DeckCardProps {
  deck: {
    id: number;
    title: string;
    description?: string;
    cardCount: number;
    createdAt: string;
    creationMethod: string;
    color?: string;
  };
  onPractice?: (deckId: number) => void;
  showActions?: boolean;
}

export default function DeckCard({ deck, onPractice, showActions = true }: DeckCardProps) {
  const router = useRouter();

  const handlePractice = async () => {
    if (onPractice) {
      onPractice(deck.id);
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
      toast.error("Failed to start practice session");
    }
  };

  const handleView = () => {
    router.push(`/flashcards/deck/${deck.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCreationMethodBadge = (method: string) => {
    switch (method) {
      case "ai_generated":
        return (
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        );
      case "manual":
        return (
          <Badge variant="outline" className="text-xs">
            Manual
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {method}
          </Badge>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {deck.title}
            </CardTitle>
            {deck.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {deck.description}
              </p>
            )}
          </div>
          {deck.color && (
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 ml-2"
              style={{ backgroundColor: deck.color }}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                <strong className="text-gray-900">{deck.cardCount}</strong> cards
              </span>
              <div className="flex items-center text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(deck.createdAt)}
              </div>
            </div>
          </div>

          {/* Creation method badge */}
          <div className="flex items-center justify-between">
            {getCreationMethodBadge(deck.creationMethod)}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handlePractice}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="sm"
                disabled={deck.cardCount === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Practice
              </Button>
              <Button
                onClick={handleView}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
