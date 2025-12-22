"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Play,
  Volume2,
  FileText,
  Loader2,
  Files,
  Plus,
  X,
  Edit,
  Save,
  Flame,
  Calendar,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { documentAPI, practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import FileUpload from "./components/file-upload";
import DeckList from "@/components/flashcards/DeckList";
import ManualFlashcardCreator from "@/components/ManualFlashcardCreator";
import StreakHistory from "@/components/StreakHistory";

// New minimalist dashboard components
import { DashboardShell } from "@/components/DashboardShell";
import { KpiRow } from "@/components/KpiRow";
import { StudyQuickStart } from "@/components/StudyQuickStart";
import { RecentFilesList } from "@/components/RecentFilesList";
import { StreakCard } from "@/components/StreakCard";

// Podcast imports
import { podcastAPI, Podcast } from "@/lib/podcasts";
import AudioPodcastPlayer from "@/components/AudioPodcastPlayer";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Music,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

// Podcasts Tab Component
function PodcastsTab({ user, router }: { user: any; router: any }) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPodcasts();
    }
  }, [user]);

  const fetchPodcasts = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await podcastAPI.getUserPodcasts(user.id);

      if (result.success && result.podcasts) {
        setPodcasts(result.podcasts);
      } else {
        setError(result.error || "Failed to load podcasts");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (podcastId: string) => {
    try {
      const result = await podcastAPI.retryPodcast(podcastId);
      if (result.success) {
        toast.success("Retrying podcast generation...");
        fetchPodcasts();
      } else {
        toast.error(result.error || "Failed to retry");
      }
    } catch (err) {
      toast.error("Failed to retry podcast generation");
    }
  };

  const handleDelete = async (podcastId: string) => {
    try {
      const result = await podcastAPI.deletePodcast(podcastId);
      if (result.success) {
        toast.success("Podcast deleted successfully");
        setPodcasts(podcasts.filter((p) => p.id !== podcastId));
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("Failed to delete podcast");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Generating
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
        <p className="text-gray-600">Loading your podcasts...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Failed to load podcasts</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                onClick={fetchPodcasts}
                variant="outline"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (podcasts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">My Podcasts</h1>
          <p className="text-slate-600">Generated podcasts from your study materials</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <div className="text-center py-12">
            <Flame className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generate Your First Podcast
            </h3>
            <p className="text-gray-600 mb-6">
              Go to "My Files", extract text from a PDF, and click "Generate Podcast" to
              create your first audio study material.
            </p>
            <Button
              onClick={() => router.push("/assistant/files")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Go to Files
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Podcasts List
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Podcasts</h1>
            <p className="text-gray-600">Listen to all your generated podcasts</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {podcasts.map((podcast) => (
          <div key={podcast.id}>
            {/* Podcast Status Card for pending/failed */}
            {podcast.status !== "ready" && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{podcast.title}</h3>
                        {getStatusBadge(podcast.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {podcast.status === "pending" && "Generating audio in background..."}
                        {podcast.status === "failed" &&
                          `Failed: ${podcast.error_message || "Unknown error"}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {formatDate(podcast.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {podcast.status === "failed" && (
                        <Button
                          onClick={() => handleRetry(podcast.id)}
                          variant="outline"
                          size="sm"
                          className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(podcast.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Player for ready podcasts */}
            {podcast.status === "ready" && podcast.audio_url && (
              <div>
                <AudioPodcastPlayer
                  audioUrl={podcast.audio_url}
                  title={podcast.title}
                  podcastId={podcast.id}
                />
                <div className="flex items-center justify-between mt-2 px-2">
                  <p className="text-xs text-gray-500">
                    Created {formatDate(podcast.created_at)}
                  </p>
                  <Button
                    onClick={() => handleDelete(podcast.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total podcasts: <span className="font-semibold">{podcasts.length}</span>
          </span>
          <span className="text-gray-600">
            Ready to play:{" "}
            <span className="font-semibold text-green-600">
              {podcasts.filter((p) => p.status === "ready").length}
            </span>
          </span>
          <span className="text-gray-600">
            Generating:{" "}
            <span className="font-semibold text-yellow-600">
              {podcasts.filter((p) => p.status === "pending").length}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("document");
  const [activeMainTab, setActiveMainTab] = useState("dashboard");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<number | null>(
    null
  );
  const [recentDecks, setRecentDecks] = useState<any[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);

  // Manual flashcard states
  const [manualFlashcards, setManualFlashcards] = useState<
    Array<{
      id: string;
      question: string;
      answer: string;
      explanation?: string;
    }>
  >([]);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [isCreatingManualDeck, setIsCreatingManualDeck] = useState(false);

  // Load recent decks
  const loadRecentDecks = async () => {
    if (!user) return;

    try {
      setDecksLoading(true);
      const result = await practiceAPI.getUserDecks(1, 6); // Get first 6 decks
      if (result.success) {
        setRecentDecks(result.data.decks);
      }
    } catch (error) {
      console.error("Failed to load recent decks:", error);
    } finally {
      setDecksLoading(false);
    }
  };

  const addManualCard = () => {
    const newCard = {
      id: Date.now().toString(),
      question: "",
      answer: "",
      explanation: "",
    };
    setManualFlashcards([...manualFlashcards, newCard]);
    setEditingCard(newCard.id);
  };

  const updateManualCard = (id: string, field: string, value: string) => {
    setManualFlashcards(
      manualFlashcards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const removeManualCard = (id: string) => {
    setManualFlashcards(manualFlashcards.filter((card) => card.id !== id));
    if (editingCard === id) setEditingCard(null);
  };

  const saveManualCard = (id: string) => {
    setEditingCard(null);
  };

  const createManualDeck = async () => {
    if (!user) {
      alert("Please log in to create flashcard decks");
      return;
    }

    if (!title.trim() || manualFlashcards.length === 0) {
      alert("Please provide a title and at least one flashcard");
      return;
    }

    const validFlashcards = manualFlashcards.filter(
      (card) => card.question.trim() && card.answer.trim()
    );

    if (validFlashcards.length === 0) {
      alert("Please provide valid question and answer pairs");
      return;
    }

    try {
      setIsCreatingManualDeck(true);

      const result = await practiceAPI.createDeck({
        title,
        flashcards: validFlashcards.map((card) => ({
          question: card.question,
          answer: card.answer,
          explanation: card.explanation || null,
        })),
      });

      if (result.success) {
        alert("Manual flashcard deck created successfully!");

        // Reset form
        setTitle("");
        setManualFlashcards([]);
        setEditingCard(null);

        // Refresh recent decks
        loadRecentDecks();
      } else {
        throw new Error(result.message || "Failed to create manual deck");
      }
    } catch (error) {
      console.error("Error creating manual deck:", error);
      alert("Error creating manual deck. Please try again.");
    } finally {
      setIsCreatingManualDeck(false);
    }
  };

  // Load recent decks when user is available
  useEffect(() => {
    if (user) {
      loadRecentDecks();
    }
  }, [user]);

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && ["dashboard", "flashcards", "files", "podcasts"].includes(tab)) {
      setActiveMainTab(tab);
    }
  }, [searchParams]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      const validExtensions = [".pdf", ".docx", ".txt"];

      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidType && !hasValidExtension) {
        toast.error("Please select a valid file (PDF, DOCX, or TXT)");
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        // 15MB limit
        toast.error("File size must be less than 15MB");
        return;
      }

      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for default title
      }
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    if (!user) {
      toast.error("Please log in to upload documents");
      return;
    }

    setIsUploading(true);
    try {
      const result = await documentAPI.uploadDocument(
        selectedFile,
        title.trim()
      );

      if (result.success) {
        setUploadedDocumentId(result.documentId);
        toast.success("Document uploaded successfully!");
      } else {
        toast.error(result.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteDocument = async () => {
    if (!textContent.trim() || !title.trim()) {
      toast.error("Please enter both title and text content");
      return;
    }

    if (textContent.trim().length < 100) {
      toast.error("Text must be at least 100 characters long");
      return;
    }

    if (!user) {
      toast.error("Please log in to save documents");
      return;
    }

    setIsUploading(true);
    try {
      const result = await documentAPI.pasteDocument(
        title.trim(),
        textContent.trim()
      );

      if (result.success) {
        setUploadedDocumentId(result.documentId);
        toast.success("Text saved successfully!");
      } else {
        toast.error(result.message || "Failed to save text");
      }
    } catch (error) {
      console.error("Paste error:", error);
      toast.error("Failed to save text");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!user) {
      toast.error("Please log in to generate flashcards");
      return;
    }

    // Determine what content to use
    let requestData: any = {
      userId: user.id,
      deckTitle: title.trim() || "My Flashcards",
    };

    if (uploadedDocumentId) {
      requestData.documentId = uploadedDocumentId;
    } else if (selectedTab === "text" && textContent.trim()) {
      if (textContent.trim().length < 100) {
        toast.error("Text must be at least 100 characters long");
        return;
      }
      requestData.text = textContent.trim();
    } else if (selectedTab === "document" && !uploadedDocumentId) {
      toast.error("Please upload a document first");
      return;
    } else {
      toast.error("Please provide content to generate flashcards");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await documentAPI.generateFlashcards(requestData);

      if (result.success) {
        toast.success(
          `Successfully generated ${result.cardsCreated} flashcards!`
        );

        // Redirect to the generated deck
        setTimeout(() => {
          router.push(`/flashcards/deck/${result.deckId}`);
        }, 1500);
      } else {
        toast.error(result.message || "Failed to generate flashcards");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const podcasts = [
    {
      id: 1,
      title: "ML Fundamentals Audio Lecture",
      duration: "15:32",
      course: "Machine Learning",
      createdDate: "2 days ago",
    },
    {
      id: 2,
      title: "Database Design Principles",
      duration: "22:18",
      course: "Database Systems",
      createdDate: "1 week ago",
    },
  ];

  return (
    <Tabs
      value={activeMainTab}
      onValueChange={setActiveMainTab}
      className="w-full"
    >
      {/* Dashboard Tab - New Minimalist Design */}
      <TabsContent value="dashboard" className="m-0">
            <DashboardShell>
              {/* KPI Row - Full Width */}
              <KpiRow />

              {/* Left Main Area */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <StudyQuickStart />
                <RecentFilesList />
              </div>

              {/* Right Rail */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <StreakCard />
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Practice History
                  </h3>
                  <StreakHistory />
                </div>
              </div>
            </DashboardShell>
          </TabsContent>

          {/* Other tabs remain unchanged for now */}
          <TabsContent value="flashcards" className="p-6">
            <ManualFlashcardCreator />
          </TabsContent>

          <TabsContent value="files" className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  File Management
                </h1>
                <p className="text-slate-600">
                  Upload and manage your documents
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <FileUpload
                  onUploadSuccess={(file) => {
                    toast.success(
                      `File "${file.title}" uploaded successfully!`
                    );
                  }}
                  onUploadError={(error) => {
                    toast.error(`Upload failed: ${error}`);
                  }}
                  maxFileSize={15}
                  multiple={true}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
  );
}
