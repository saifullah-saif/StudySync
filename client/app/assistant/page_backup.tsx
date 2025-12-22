"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Play, Volume2, FileText, Loader2, Files, Plus, X, Edit, Save, Flame, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";
import { documentAPI, practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import FileUpload from "./components/file-upload";
import DeckList from "@/components/flashcards/DeckList";
import StreakHistory from "@/components/StreakHistory";
import { 
  getStreakData, 
  getStreakStats, 
  checkStreakStatus,
  calcLevelFromXP
} from "@/lib/learning";

// New minimalist dashboard components
import { DashboardShell } from "@/components/DashboardShell";
import { KpiRow } from "@/components/KpiRow";
import { StudyQuickStart } from "@/components/StudyQuickStart";
import { RecentFilesList } from "@/components/RecentFilesList";
import { StreakCard } from "@/components/StreakCard";

export default function AssistantPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });
  const [selectedTab, setSelectedTab] = useState("document");
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

  // Streak and stats states
  const [streakStats, setStreakStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalPracticeDays: 0,
    averagePerWeek: 0,
    lastPracticeDate: '',
    streakStatus: 'active' as 'active' | 'broken' | 'frozen'
  });
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    flashcardsReviewed: 0,
    accuracy: 0
  });
  const [streakBroken, setStreakBroken] = useState(false);

  // Manual flashcard states
  const [manualFlashcards, setManualFlashcards] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    explanation?: string;
  }>>([]);
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

  // Load streak and user statistics
  const loadUserStats = () => {
    // Load streak data
    const currentStreakStats = getStreakStats();
    setStreakStats(currentStreakStats);

    // Check if streak is broken
    const { isBroken } = checkStreakStatus();
    setStreakBroken(isBroken);

    // Load user stats from localStorage
    const storedXP = parseInt(localStorage.getItem('studyXP') || '0');
    const level = calcLevelFromXP(storedXP);
    const flashcardsReviewed = parseInt(localStorage.getItem('totalFlashcardsReviewed') || '0');
    const totalCorrect = parseInt(localStorage.getItem('totalCorrect') || '0');
    const totalIncorrect = parseInt(localStorage.getItem('totalIncorrect') || '0');
    const accuracy = totalCorrect + totalIncorrect > 0 ? 
      Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    setUserStats({
      xp: storedXP,
      level,
      flashcardsReviewed,
      accuracy
    });
  };

  // Calculate time remaining until midnight
  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  };

  const addManualCard = () => {
    const newCard = {
      id: Date.now().toString(),
      question: "",
      answer: "",
      explanation: ""
    };
    setManualFlashcards([...manualFlashcards, newCard]);
    setEditingCard(newCard.id);
  };

  const updateManualCard = (id: string, field: string, value: string) => {
    setManualFlashcards(manualFlashcards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  const removeManualCard = (id: string) => {
    setManualFlashcards(manualFlashcards.filter(card => card.id !== id));
    if (editingCard === id) setEditingCard(null);
  };

  const saveManualCard = (id: string) => {
    setEditingCard(null);
  };

  const createManualDeck = async () => {
    console.log("createManualDeck called");
    console.log("User:", user);
    console.log("Title:", title);
    console.log("Manual flashcards:", manualFlashcards);

    if (!user) {
      alert("Please log in to create flashcard decks");
      return;
    }

    if (!title.trim() || manualFlashcards.length === 0) {
      alert("Please provide a title and at least one flashcard");
      return;
    }

    const validFlashcards = manualFlashcards.filter(card => 
      card.question.trim() && card.answer.trim()
    );

    if (validFlashcards.length === 0) {
      alert("Please provide valid question and answer pairs");
      return;
    }

    try {
      setIsCreatingManualDeck(true);
      console.log("Calling practiceAPI.createDeck with data:", {
        title,
        flashcards: validFlashcards
      });
      
      const result = await practiceAPI.createDeck({
        title,
        flashcards: validFlashcards.map(card => ({
          question: card.question,
          answer: card.answer,
          explanation: card.explanation || null
        }))
      });

      console.log("API result:", result);

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

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeUntilMidnight();
      setTimeRemaining(newTime);
    }, 1000);

    // Initial calculation
    setTimeRemaining(calculateTimeUntilMidnight());

    return () => clearInterval(timer);
  }, []);

  // Load recent decks when user is available
  useEffect(() => {
    if (user) {
      loadRecentDecks();
    }
  }, [user]);

  // Load user stats on component mount and when user changes
  useEffect(() => {
    loadUserStats();
    
    // Refresh stats every 30 seconds
    const statsInterval = setInterval(loadUserStats, 30000);
    
    return () => clearInterval(statsInterval);
  }, [user]);

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
    <>
      <main>
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="flashcards">Create Flashcards</TabsTrigger>
                <TabsTrigger value="files">My Files</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
              </TabsList>
            </div>
          </div>

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

          {/* Create Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Flashcard Content Input
              </h1>
              <p className="text-gray-600">
                Upload a document or paste your text to generate flashcards
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                {/* Title Input */}
                <div className="mb-6">
                  <Label
                    htmlFor="flashcard-title"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Flashcard Deck Title *
                  </Label>
                  <Input
                    id="flashcard-title"
                    type="text"
                    placeholder="Enter a title for your flashcard deck"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                    disabled={isUploading || isGenerating}
                  />
                </div>

                {/* Tab Selector */}
                <div className="flex mb-8">
                  <button
                    onClick={() => setSelectedTab("document")}
                    className={`flex-1 py-3 px-6 text-center font-medium rounded-l-lg transition-colors ${
                      selectedTab === "document"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={isUploading || isGenerating}
                  >
                    Document
                  </button>
                  <button
                    onClick={() => setSelectedTab("text")}
                    className={`flex-1 py-3 px-6 text-center font-medium transition-colors ${
                      selectedTab === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={isUploading || isGenerating}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setSelectedTab("manual")}
                    className={`flex-1 py-3 px-6 text-center font-medium rounded-r-lg transition-colors ${
                      selectedTab === "manual"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={isUploading || isGenerating}
                  >
                    Manual
                  </button>
                </div>

                {/* Document Tab */}
                {selectedTab === "document" && (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center bg-blue-50">
                      {uploadedDocumentId ? (
                        <div className="text-green-600">
                          <FileText className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">
                            Document uploaded successfully!
                          </p>
                          <p className="text-sm text-gray-600">
                            Ready to generate flashcards
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                          <p className="text-gray-700 mb-4">
                            Drag and drop your files or upload from computer
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            Supported formats: PDF, DOCX, TXT (max 15MB)
                          </p>
                          <div className="flex items-center justify-center gap-4">
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer"
                            >
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isUploading || isGenerating}
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  "Choose file"
                                )}
                              </Button>
                              <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileSelect}
                                disabled={isUploading || isGenerating}
                              />
                            </label>
                            <span className="text-gray-500">
                              {selectedFile
                                ? selectedFile.name
                                : "No file chosen"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {!uploadedDocumentId ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg font-semibold"
                        disabled={
                          !selectedFile ||
                          !title.trim() ||
                          isUploading ||
                          isGenerating
                        }
                        onClick={handleUploadDocument}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Uploading Document...
                          </>
                        ) : (
                          "Upload Document"
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-semibold"
                        onClick={handleGenerateFlashcards}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating Flashcards...
                          </>
                        ) : (
                          "Generate Flashcards"
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Text Tab */}
                {selectedTab === "text" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="text-content"
                        className="text-sm font-medium text-gray-700"
                      >
                        Paste your notes (minimum 100 characters) *
                      </Label>
                      <Textarea
                        id="text-content"
                        placeholder="Paste your notes here..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="min-h-[300px] bg-blue-50 border-blue-300 text-lg"
                        disabled={isUploading || isGenerating}
                      />
                      <p className="text-sm text-gray-500">
                        Character count: {textContent.length} / 100 minimum
                      </p>
                    </div>

                    {!uploadedDocumentId ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg font-semibold"
                        disabled={
                          !textContent.trim() ||
                          textContent.length < 100 ||
                          !title.trim() ||
                          isUploading ||
                          isGenerating
                        }
                        onClick={handlePasteDocument}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving Text...
                          </>
                        ) : (
                          "Save Text"
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-semibold"
                        onClick={handleGenerateFlashcards}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating Flashcards...
                          </>
                        ) : (
                          "Generate Flashcards"
                        )}
                      </Button>
                    )}

                    {/* Alternative: Generate directly from text */}
                    {!uploadedDocumentId &&
                      textContent.length >= 100 &&
                      title.trim() && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-600 mb-3 text-center">
                            Or generate flashcards directly without saving:
                          </p>
                          <Button
                            variant="outline"
                            className="w-full py-3 text-lg font-semibold"
                            onClick={handleGenerateFlashcards}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating Flashcards...
                              </>
                            ) : (
                              "Generate Flashcards Directly"
                            )}
                          </Button>
                        </div>
                      )}
                  </div>
                )}

                {/* Manual Tab */}
                {selectedTab === "manual" && (
                  <div className="space-y-6">
                    {/* Current flashcards */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">
                          Flashcards ({manualFlashcards.length})
                        </Label>
                        <Button
                          onClick={addManualCard}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={isCreatingManualDeck}
                        >
                          <Plus className="w-4 h-4" />
                          Add Card
                        </Button>
                      </div>

                      {manualFlashcards.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No flashcards yet. Click "Add Card" to get started.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {manualFlashcards.map((card, index) => (
                            <Card key={card.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">
                                    Card {index + 1}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {editingCard === card.id ? (
                                      <Button
                                        onClick={() => saveManualCard(card.id)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Save className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() => setEditingCard(card.id)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => removeManualCard(card.id)}
                                      variant="destructive"
                                      size="sm"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>

                                {editingCard === card.id ? (
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">
                                        Question *
                                      </Label>
                                      <Textarea
                                        placeholder="Enter your question..."
                                        value={card.question}
                                        onChange={(e) =>
                                          updateManualCard(card.id, "question", e.target.value)
                                        }
                                        className="min-h-[80px] mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">
                                        Answer *
                                      </Label>
                                      <Textarea
                                        placeholder="Enter the answer..."
                                        value={card.answer}
                                        onChange={(e) =>
                                          updateManualCard(card.id, "answer", e.target.value)
                                        }
                                        className="min-h-[80px] mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">
                                        Explanation (Optional)
                                      </Label>
                                      <Textarea
                                        placeholder="Add an explanation..."
                                        value={card.explanation || ""}
                                        onChange={(e) =>
                                          updateManualCard(card.id, "explanation", e.target.value)
                                        }
                                        className="min-h-[60px] mt-1"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">Question:</p>
                                      <p className="text-sm text-gray-900">
                                        {card.question || <em className="text-gray-400">No question yet</em>}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">Answer:</p>
                                      <p className="text-sm text-gray-900">
                                        {card.answer || <em className="text-gray-400">No answer yet</em>}
                                      </p>
                                    </div>
                                    {card.explanation && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">Explanation:</p>
                                        <p className="text-sm text-gray-600">{card.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Create deck button */}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-semibold"
                      onClick={createManualDeck}
                      disabled={
                        isCreatingManualDeck
                      }
                    >
                      {isCreatingManualDeck ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Deck...
                        </>
                      ) : (
                        "Create Flashcard Deck"
                      )}
                    </Button>
                    
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mt-2">
                      Debug - Title: "{title}", Cards: {manualFlashcards.length}, Valid Cards: {manualFlashcards.filter(card => card.question.trim() && card.answer.trim()).length}
                    </div>
                  </div>
                )}

                {/* Generation Progress */}
                {isGenerating && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Generating your flashcards...
                        </p>
                        <p className="text-sm text-blue-700">
                          This may take a few moments while we process your
                          content with AI.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Flashcard Decks */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Recent Flashcard Decks
                </h2>
                <Button
                  variant="outline"
                  onClick={() => router.push("/flashcards")}
                  className="text-sm"
                >
                  <Files className="w-4 h-4 mr-2" />
                  View All Decks
                </Button>
              </div>

              <DeckList
                decks={recentDecks}
                loading={decksLoading}
                emptyMessage="No flashcard decks yet"
                emptyDescription="Upload a document and generate flashcards to get started."
                onPractice={(deckId) => {
                  // Handle practice session creation
                  practiceAPI
                    .createPracticeSession(deckId)
                    .then((result) => {
                      if (result.success) {
                        router.push(`/practice/${result.data.sessionId}`);
                      } else {
                        toast.error(
                          result.message || "Failed to start practice session"
                        );
                      }
                    })
                    .catch((error) => {
                      console.error("Practice session error:", error);
                      toast.error("Failed to start practice session");
                    });
                }}
              />
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                File Management
              </h1>
              <p className="text-gray-600">
                Upload and manage your documents for flashcard generation
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <FileUpload
                onUploadSuccess={(file) => {
                  toast.success(`File "${file.title}" uploaded successfully!`);
                  // Optionally refresh file list or update state
                }}
                onUploadError={(error) => {
                  toast.error(`Upload failed: ${error}`);
                }}
                maxFileSize={15}
                multiple={true}
              />

              <div className="mt-8 text-center">
                <Button
                  onClick={() => router.push("/assistant/files")}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <Files className="h-4 w-4 mr-2" />
                  View All Files
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Podcasts Tab */}
          <TabsContent value="podcasts" className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Podcast Generator
              </h1>
              <p className="text-gray-600">
                Transform your notes into AI-generated audio lectures
              </p>
            </div>

            {/* Content Input for Podcasts */}
            <Card className="max-w-2xl mx-auto mb-8">
              <CardContent className="p-8">
                {/* Tab Selector */}
                <div className="flex mb-8">
                  <button
                    onClick={() => setSelectedTab("document")}
                    className={`flex-1 py-3 px-6 text-center font-medium rounded-l-lg transition-colors ${
                      selectedTab === "document"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Document
                  </button>
                  <button
                    onClick={() => setSelectedTab("text")}
                    className={`flex-1 py-3 px-6 text-center font-medium rounded-r-lg transition-colors ${
                      selectedTab === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Text
                  </button>
                </div>

                {/* Document Tab */}
                {selectedTab === "document" && (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center bg-blue-50">
                      <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-700 mb-4">
                        Drag and drop your files or upload from computer
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <label
                          htmlFor="podcast-file-upload"
                          className="cursor-pointer"
                        >
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Choose file
                          </Button>
                          <input
                            id="podcast-file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <span className="text-gray-500">
                          {selectedFile ? selectedFile.name : "No file chosen"}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg font-semibold"
                      disabled={!selectedFile}
                    >
                      GENERATE PODCAST
                    </Button>
                  </div>
                )}

                {/* Text Tab */}
                {selectedTab === "text" && (
                  <div className="space-y-6">
                    <Textarea
                      placeholder="Paste your notes here"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-[300px] bg-blue-50 border-blue-300 text-lg"
                    />

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg font-semibold"
                      disabled={!textContent.trim()}
                    >
                      GENERATE PODCAST
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Podcast Library */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Your Podcast Library
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {podcasts.map((podcast) => (
                  <Card
                    key={podcast.id}
                    className="bg-white hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {podcast.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {podcast.course} • {podcast.duration}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created {podcast.createdDate}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
