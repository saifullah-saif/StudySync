"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import { documentAPI, practiceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import FileUpload from "./file-upload";
import ManualFlashcardCreator from "@/components/ManualFlashcardCreator";
import StreakHistory from "@/components/StreakHistory";

// New minimalist dashboard components
import { DashboardShell } from "@/components/DashboardShell";
import { KpiRow } from "@/components/KpiRow";
import { StudyQuickStart } from "@/components/StudyQuickStart";
import { RecentFilesList } from "@/components/RecentFilesList";
import { StreakCard } from "@/components/StreakCard";

interface AssistantClientPageProps {
  initialTab: string;
}

export default function AssistantClientPage({
  initialTab,
}: AssistantClientPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  // All your existing state and logic here...
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
      const result = await practiceAPI.getUserDecks(1, 6);
      if (result.success) {
        setRecentDecks(result.data.decks);
      }
    } catch (error) {
      console.error("Failed to load recent decks:", error);
    } finally {
      setDecksLoading(false);
    }
  };

  // Load recent decks when user is available
  useEffect(() => {
    if (user) {
      loadRecentDecks();
    }
  }, [user]);

  // Update tab when initialTab changes
  useEffect(() => {
    setActiveMainTab(initialTab);
  }, [initialTab]);

  return (
    <>
      <main>
        <Tabs
          value={activeMainTab}
          onValueChange={setActiveMainTab}
          className="w-full"
        >
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

          {/* Other tabs */}
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

          <TabsContent value="podcasts" className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  My Podcasts
                </h1>
                <p className="text-slate-600">
                  Generated podcasts from your study materials
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="text-center py-12">
                  <Flame className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Generate Your First Podcast
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Go to "My Files", extract text from a PDF, and click
                    "Generate Podcast" to create your first audio study
                    material.
                  </p>
                  <Button
                    onClick={() => setActiveMainTab("files")}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Go to Files
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
