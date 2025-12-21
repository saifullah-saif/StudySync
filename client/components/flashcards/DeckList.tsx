"use client";

import React from "react";
import DeckCard from "./DeckCard";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";

interface Deck {
  id: number;
  title: string;
  description?: string;
  cardCount: number;
  createdAt: string;
  creationMethod: string;
  color?: string;
}

interface DeckListProps {
  decks: Deck[];
  loading?: boolean;
  onPractice?: (deckId: number) => void;
  showActions?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

export default function DeckList({
  decks,
  loading = false,
  onPractice,
  showActions = true,
  emptyMessage = "No flashcard decks found",
  emptyDescription = "Create your first deck by uploading a document and generating flashcards.",
  className = "",
}: DeckListProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="h-48">
            <CardContent className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            {emptyDescription}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onPractice={onPractice}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
