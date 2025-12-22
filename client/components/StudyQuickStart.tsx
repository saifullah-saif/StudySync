// Prominent CTA card for quick study session start
"use client";

import { THEME } from "@/styles/theme";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface Deck {
  id: number;
  title: string;
  flashcard_count: number;
}

export function StudyQuickStart() {
  const { user } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [loading, setLoading] = useState(false);
  const [decksLoading, setDecksLoading] = useState(false);

  // Load user's decks
  const loadDecks = async () => {
    if (!user) return;

    try {
      setDecksLoading(true);
      const result = await practiceAPI.getUserDecks(1, 20); // Get up to 20 decks
      if (result.success) {
        setDecks(result.data.decks);
        // Auto-select first deck if available
        if (result.data.decks.length > 0) {
          setSelectedDeckId(result.data.decks[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load decks:", error);
    } finally {
      setDecksLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [user]);

  const handleStartStudy = async () => {
    if (!selectedDeckId) return;

    setLoading(true);
    try {
      // Navigate to the flashcard deck page for the selected deck
      router.push(`/flashcards/deck/${selectedDeckId}`);
    } catch (error) {
      console.error("Failed to start study session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <BookOpen className="h-5 w-5 text-sky-600" />
        <h2 className={`text-lg font-semibold ${THEME.text}`}>Quick Study</h2>
      </div>

      <p className={`${THEME.subtext} mb-6`}>
        Practice your flashcard decks with spaced repetition
      </p>

      <div className="space-y-4">
        {/* Deck Selector */}
        <div>
          <label className={`block text-sm font-medium ${THEME.text} mb-2`}>
            Choose Deck
          </label>
          {decksLoading ? (
            <div className="w-full h-10 bg-slate-100 rounded-md animate-pulse"></div>
          ) : decks.length > 0 ? (
            <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
              <SelectTrigger className="w-full bg-white border-slate-300">
                <SelectValue placeholder="Select a deck to practice" />
              </SelectTrigger>
              <SelectContent
                className="!bg-white border border-slate-200 shadow-lg rounded-md z-50 backdrop-blur-none"
                style={{ backgroundColor: "#ffffff", opacity: 1 }}
              >
                {decks.map((deck) => (
                  <SelectItem
                    key={deck.id}
                    value={deck.id.toString()}
                    className="hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer !bg-white"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {deck.title} ({deck.flashcard_count} cards)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center py-4">
              <p className={`text-sm ${THEME.subtext} mb-3`}>
                No flashcard decks found
              </p>
              <Link href="/assistant/create-flashcards">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Deck
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Start Button */}
        {decks.length > 0 && (
          <Button
            onClick={handleStartStudy}
            disabled={!selectedDeckId || loading}
            className={`w-full ${THEME.primaryGradient} hover:from-sky-700 hover:to-indigo-700 text-white font-medium py-3 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50`}
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? "Starting..." : "Start Study Session"}
          </Button>
        )}

        <div className="flex space-x-2">
          <Link href="/library" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Browse All Decks
            </Button>
          </Link>
          <Link href="/assistant/create-flashcards" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        <p className={`text-xs ${THEME.subtext} text-center`}>
          Review cards due today and maintain your learning streak
        </p>
      </div>
    </div>
  );
}
