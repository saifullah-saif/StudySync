"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import DeckList from "@/components/flashcards/DeckList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  ChevronDown,
  FileText,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface Deck {
  id: number;
  title: string;
  description?: string;
  cardCount: number;
  createdAt: string;
  creationMethod: string;
  color?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [filterBy, setFilterBy] = useState("all");
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
  });

  useEffect(() => {
    if (!user) {
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    loadDecks();
  }, [user, pagination.currentPage]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const result = await practiceAPI.getUserDecks(
        pagination.currentPage,
        pagination.limit
      );

      if (result.success) {
        setDecks(result.data.decks);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to load flashcard decks");
      }
    } catch (error) {
      console.error("Load decks error:", error);
      toast.error("Failed to load flashcard decks");
    } finally {
      setLoading(false);
    }
  };

  const handlePractice = async (deckId: number) => {
    try {
      const result = await practiceAPI.createPracticeSession(deckId);
      if (result.success) {
        router.push(`/practice/${result.data.sessionId}`);
      } else {
        toast.error(result.message || "Failed to start practice session");
      }
    } catch (error) {
      console.error("Practice session error:", error);
      toast.error("Failed to start practice session");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  // Filter and sort decks based on current criteria
  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deck.description &&
        deck.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterBy === "all" ||
      (filterBy === "ai_generated" && deck.creationMethod === "ai_generated") ||
      (filterBy === "manual" && deck.creationMethod === "manual");

    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-down">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/assistant")}
              className="hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                Flashcard Decks
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and practice with your flashcard collections
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/30 transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Create New Deck
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push("/assistant?tab=flashcards")}
                className="cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                Create Manually
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/assistant/files")}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate from Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 glass-effect border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search decks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-slate-200/50 focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>

              {/* Filter by creation method */}
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decks</SelectItem>
                  <SelectItem value="ai_generated">AI Generated</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort by */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="card_count">Card Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {pagination.totalCount}
              </div>
              <div className="text-sm text-gray-600">Total Decks</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {decks.reduce((sum, deck) => sum + deck.cardCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  decks.filter((d) => d.creationMethod === "ai_generated")
                    .length
                }
              </div>
              <div className="text-sm text-gray-600">AI Generated</div>
            </CardContent>
          </Card>
        </div>

        {/* Deck List */}
        <DeckList
          decks={filteredDecks}
          loading={loading}
          onPractice={handlePractice}
          emptyMessage="No flashcard decks found"
          emptyDescription="Upload a document and generate flashcards to create your first deck."
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>

            {[...Array(pagination.totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <Button
                  key={page}
                  variant={
                    pagination.currentPage === page ? "default" : "outline"
                  }
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
