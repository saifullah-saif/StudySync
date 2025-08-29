"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Check,
  Edit2,
  Save,
  Trash2,
  EyeOff,
} from "lucide-react";
import { flashcardAPI } from "@/lib/api";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  showAnswer?: boolean;
  known?: boolean;
}

interface FlashcardsPanelProps {
  flashcards?: Flashcard[]; // optional - if not provided, read from sessionStorage
  title?: string;
  fileId?: number | string;
  onSave?: (deckId: string) => void;
}

const PAGE_SIZE = 20;

export default function FlashcardsPanel(props: FlashcardsPanelProps) {
  const {
    flashcards: initialPropCards,
    title: initialTitle,
    fileId,
    onSave,
  } = props;

  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [title, setTitle] = useState(initialTitle || "My Flashcards");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // load from prop -> sessionStorage fallback
  useEffect(() => {
    if (initialPropCards && Array.isArray(initialPropCards)) {
      setCards(
        initialPropCards.map((c) => ({ ...c, showAnswer: !!c.showAnswer }))
      );
      return;
    }

    try {
      const raw = sessionStorage.getItem("currentFlashcards");
      if (raw) {
        const parsed = JSON.parse(raw);
        const deck = parsed.flashcards || parsed.qsAns || parsed;
        setTitle(parsed.title || title);
        setCards(
          (deck || []).map((c: any, i: number) => ({
            id: c.id ?? String(i),
            question: c.question ?? c.q ?? "",
            answer: c.answer ?? c.a ?? "",
            showAnswer: false,
          }))
        );
      } else {
        setCards([]);
      }
    } catch (e) {
      console.error("Failed to read flashcards from sessionStorage", e);
      setCards([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPropCards]);

  const total = cards?.length || 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((cards?.length || 0) / PAGE_SIZE)),
    [cards]
  );
  const visibleCards = useMemo(() => {
    if (!cards) return [];
    const start = (page - 1) * PAGE_SIZE;
    return cards.slice(start, start + PAGE_SIZE);
  }, [cards, page]);

  function toggleShowAnswer(id: string) {
    setCards(
      (prev) =>
        prev?.map((c) =>
          c.id === id ? { ...c, showAnswer: !c.showAnswer } : c
        ) || null
    );
  }

  function markKnown(id: string, known = true) {
    setCards(
      (prev) => prev?.map((c) => (c.id === id ? { ...c, known } : c)) || null
    );
  }

  function removeCard(id: string) {
    setCards((prev) => prev?.filter((c) => c.id !== id) || null);
    toast.success("Card removed");
  }

  function startEdit(id: string) {
    setEditingId(id);
  }

  function saveEdit(id: string, question: string, answer: string) {
    setCards(
      (prev) =>
        prev?.map((c) => (c.id === id ? { ...c, question, answer } : c)) || null
    );
    setEditingId(null);
    toast.success("Card updated");
  }

  async function handleSaveDeck() {
    if (!cards || cards.length === 0) {
      toast.error("No flashcards to save");
      return;
    }

    setLoading(true);
    toast.info("Saving deck…");
    try {
      // Use your existing flashcard API
      const payload = {
        title,
        sourceFileId: fileId ? Number(fileId) : null,
        qsAns: cards.map(({ question, answer }) => ({ question, answer })),
      };

      const resp = await flashcardAPI.generateFlashcards(payload);
      if (resp?.success) {
        toast.success("Deck saved successfully!");
        onSave?.(resp.data?.deckId || String(Date.now()));
      } else {
        toast.error(resp?.message || "Failed to save deck");
      }
    } catch (err: any) {
      console.error("Failed to save deck", err);
      toast.error(err?.message || "Failed to save deck");
    } finally {
      setLoading(false);
    }
  }

  if (cards === null) {
    return (
      <div className="py-12 text-center">
        <div className="text-gray-500">Loading flashcards…</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-lg font-semibold">No flashcards found</h3>
        <p className="text-sm text-gray-500 mt-2">
          Generate flashcards from a processed PDF first.
        </p>
      </div>
    );
  }

  const knownCount = cards.filter((c) => c.known).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex gap-2">
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {total} cards
            </span>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              {knownCount} known
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="flex items-center px-3 text-sm text-gray-600">
            Page {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
          <Button size="sm" onClick={handleSaveDeck} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Deck"}
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleCards.map((card) => (
          <Card key={card.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {editingId === card.id ? (
                    <InlineEditor
                      card={card}
                      onCancel={() => setEditingId(null)}
                      onSave={(q, a) => saveEdit(card.id, q, a)}
                    />
                  ) : (
                    <>
                      <div className="font-medium text-gray-900 mb-3">
                        {card.question}
                      </div>
                      <div
                        className={`text-sm text-gray-700 transition-opacity duration-200 ${
                          card.showAnswer ? "opacity-100" : "opacity-50"
                        }`}
                        aria-hidden={!card.showAnswer}
                      >
                        {card.showAnswer ? (
                          card.answer
                        ) : (
                          <span className="text-gray-400 italic">
                            Click to reveal answer
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-end ml-4 space-y-2">
                  {editingId !== card.id && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleShowAnswer(card.id)}
                        aria-pressed={!!card.showAnswer}
                        title={card.showAnswer ? "Hide answer" : "Show answer"}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        {card.showAnswer ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {card.showAnswer ? "Hide answer" : "Show answer"}
                        </span>
                      </Button>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(card.id)}
                          title="Edit card"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markKnown(card.id, !card.known)}
                          title="Mark known/unknown"
                        >
                          <Check
                            className={`h-4 w-4 ${
                              card.known ? "text-green-600" : "text-gray-400"
                            }`}
                          />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCard(card.id)}
                          title="Remove card"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline editor subcomponent
 */
function InlineEditor({
  card,
  onCancel,
  onSave,
}: {
  card: Flashcard;
  onCancel: () => void;
  onSave: (q: string, a: string) => void;
}) {
  const [q, setQ] = useState(card.question);
  const [a, setA] = useState(card.answer);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-600 font-medium">Question</label>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter question..."
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-gray-600 font-medium">Answer</label>
        <Input
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Enter answer..."
          className="mt-1"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          onClick={() => onSave(q, a)}
          disabled={!q.trim() || !a.trim()}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
