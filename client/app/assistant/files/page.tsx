"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  File,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Image,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Zap,
  Clock,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { fileAPI, generationAPI, flashcardAPI } from "@/lib/api";
import { podcastAPI } from "@/lib/podcasts";
import { useAuth } from "@/contexts/auth-context";
import FileUpload from "../components/file-upload";
import { langchainAPI } from "@/lib/api";
import { generateQsAns } from "@/actions/upload-actions";
import FlashcardsPanel from "@/components/FlashcardsPanel";
import PodcastPlayer from "@/components/PodcastPlayer";
import LiveTTSPlayer from "@/components/LiveTTSPlayer";
interface FileItem {
  id: number;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  lastModified: string;
  downloadCount: number;
  tags: string[];
  visibility: string;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: Array<{
    type: string;
    count: number;
    size: number;
  }>;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [sortBy, setSortBy] = useState("upload_date"); // Match backend field name
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [generatingFile, setGeneratingFile] = useState<FileItem | null>(null);
  const [generationOptions, setGenerationOptions] = useState({
    deckTitle: "",
    cardType: "basic",
    targetDifficulty: 3,
    maxCards: 20,
  });
  const [activeJobs, setActiveJobs] = useState<Map<number, any>>(new Map());
  const [showJobsDialog, setShowJobsDialog] = useState(false);

  // Flashcard-related states
  const [extractedQsAns, setExtractedQsAns] = useState<Map<number, any>>(
    new Map()
  );
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  // Podcast-related states
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  const [podcastData, setPodcastData] = useState<{
    episodeId: string;
    audioUrl: string;
    downloadUrl: string;
    chapters: Array<{
      title: string;
      startSec: number;
      durationSec: number;
      chunkIndex: number;
    }>;
    title: string;
    fileId?: number;
    demoMode?: boolean;
    textChunks?: string[];
    extractedText?: string;
  } | null>(null);

  const router = useRouter();
  const { user } = useAuth();
  const filesPerPage = 12;

  useEffect(() => {
    if (!user) {
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }
    loadFiles();
    loadStats();
  }, [currentPage, searchQuery, selectedFileType, sortBy, sortOrder, user]);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, selectedFileType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileAPI.getUserFiles(
        currentPage,
        filesPerPage,
        searchQuery,
        selectedFileType === "all" ? "" : selectedFileType,
        sortBy,
        sortOrder
      );

      // Ensure we have a valid response structure
      if (response && response.data && response.data.files) {
        setFiles(response.data.files || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (response && Array.isArray(response.files)) {
        setFiles(response.files || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        console.warn("Unexpected response structure:", response);
        setFiles([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Load files error:", error);
      toast.error("Failed to load files: " + error.message);
      setFiles([]); // Ensure files is always an array
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fileAPI.getFileStats();
      // Handle different response structures
      if (response && response.data) {
        setStats(response.data);
      } else if (response) {
        setStats(response);
      } else {
        setStats(null);
      }
    } catch (error: any) {
      console.error("Failed to load file stats:", error);
      setStats(null);
    }
  };

  const filterFiles = () => {
    // Ensure files is an array before filtering
    if (!Array.isArray(files)) {
      console.warn("Files is not an array:", files);
      setFilteredFiles([]);
      return;
    }

    let filtered = [...files];

    if (searchQuery) {
      filtered = filtered.filter(
        (file) =>
          file.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFileType !== "all") {
      filtered = filtered.filter((file) => file.fileType === selectedFileType);
    }

    setFilteredFiles(filtered);
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await fileAPI.deleteFile(fileId);
      toast.success("File deleted successfully");
      loadFiles();
      loadStats();
    } catch (error: any) {
      toast.error("Failed to delete file: " + error.message);
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const response = await fileAPI.downloadFile(fileId);

      // Handle different response structures
      const data = response.data || response;

      if (data.downloadUrl) {
        // For uploaded files, redirect to signed URL
        window.open(data.downloadUrl, "_blank");
      } else if (data.content) {
        // For text content, create blob and download
        const blob = new Blob([data.content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Invalid download response");
      }

      toast.success("File download started");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download file: " + error.message);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "docx":
      case "doc":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "txt":
        return <FileText className="h-5 w-5 text-gray-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Image className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUploadSuccess = (file: any) => {
    setShowUploadDialog(false);
    loadFiles();
    loadStats();
    toast.success("File uploaded successfully!");
  };

  //parse the pdf using langchain
  // Add this state variable with your other useState declarations
  const [processingFiles, setProcessingFiles] = useState<Set<number>>(
    new Set()
  );

  // Add this function with your other functions
  const handleProcessPDF = async (file: FileItem) => {
    try {
      setProcessingFiles((prev) => new Set(prev).add(file.id));

      toast.info(`Processing "${file.title}" with LangChain...`, {
        duration: 3000,
      });

      // Get the file download URL first
      console.log("Getting download URL for file:", file.id);
      const downloadResponse = await fileAPI.downloadFile(file.id);
      console.log("🔍 Client Debug - Full response:", downloadResponse);
      console.log("🔍 Client Debug - Response data:", downloadResponse.data);
      console.log(
        "🔍 Client Debug - Response status:",
        downloadResponse.status
      );
      console.log(
        "🔍 Client Debug - Response headers:",
        downloadResponse.headers
      );

      const downloadData = downloadResponse.data || downloadResponse;
      console.log("🔍 Client Debug - Download data:", downloadData);
      console.log("🔍 Client Debug - Download data type:", typeof downloadData);
      console.log(
        "🔍 Client Debug - Download data keys:",
        Object.keys(downloadData)
      );

      // Fix: Access the nested data property
      const fileUrl =
        downloadData.data?.downloadUrl || downloadData.downloadUrl;
      const fileName = downloadData.data?.fileName || downloadData.fileName;

      if (!fileUrl) {
        console.error("🔍 Client Debug - Missing downloadUrl in response");
        console.error(
          "🔍 Client Debug - Available keys:",
          Object.keys(downloadData)
        );
        console.error("🔍 Client Debug - Data property:", downloadData.data);
        throw new Error("Could not get file download URL");
      }

      console.log("Processing file with URL:", fileUrl);

      // Use LangChain API directly instead of generateQsAns
      const result = await langchainAPI.processFileFromUrl(fileUrl, fileName);

      if (result.success) {
        toast.success(`Successfully processed "${file.title}"`, {
          description: `Extracted ${
            result.data.wordCount
          } words and generated ${result.data.qsAns?.length || 0} Q&A pairs`,
          duration: 5000,
        });

        console.log(
          "📄 Extracted text preview:",
          result.data.extractedText?.substring(0, 500) + "..."
        );

        // Print Q&A pairs to client console as well
        if (result.data.qsAns && result.data.qsAns.length > 0) {
          console.log("\n🎓 Generated Q&A Pairs:");
          result.data.qsAns.forEach((item: any, index: number) => {
            console.log(`${index + 1}. Q: ${item.question}`);
            console.log(`   A: ${item.answer}\n`);
          });

          // Store Q&A data for flashcard generation
          console.log(`🔧 Debug: Storing Q&A data for file ID ${file.id}`);
          console.log(`🔧 Debug: Q&A data:`, result.data.qsAns);

          setExtractedQsAns((prev) => {
            const newMap = new Map(prev).set(file.id, {
              qsAns: result.data.qsAns,
              title: file.title,
              extractedText: result.data.extractedText,
            });
            console.log(`🔧 Debug: Updated extractedQsAns map:`, newMap);
            console.log(
              `🔧 Debug: Map has file ${file.id}:`,
              newMap.has(file.id)
            );
            return newMap;
          });
        } else {
          console.log("⚠️ No Q&A pairs found in result.data");
          console.log("⚠️ Result.data structure:", result.data);
          console.log("⚠️ Result.data keys:", Object.keys(result.data));
          console.log("⚠️ Full result object:", result);
          console.log("⚠️ Result.data.qsAns:", result.data.qsAns);
          console.log("⚠️ Result.data.qsAns type:", typeof result.data.qsAns);
        }
      } else {
        toast.error(`Failed to process "${file.title}": ${result.message}`);
      }
    } catch (error: any) {
      console.error("Process file error:", error);
      toast.error(`Failed to process file: ${error.message}`);
    } finally {
      setProcessingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  //generate qs and ans from the pdf using AI

  //Save the qs and ans to the database

  //redirect to the [id] summary page

  const handleGenerateFlashcards = async (file: FileItem) => {
    // Check if we have Q&A data for this file
    const qsAnsData = extractedQsAns.get(file.id);

    if (!qsAnsData || !qsAnsData.qsAns || qsAnsData.qsAns.length === 0) {
      toast.error("Please extract PDF text first to generate Q&A pairs");
      return;
    }

    try {
      setGeneratingFlashcards(true);

      toast.info(`Generating flashcards from "${file.title}"...`, {
        duration: 3000,
      });

      // Generate flashcards using the extracted Q&A data
      const result = await flashcardAPI.generateFlashcards(
        qsAnsData.qsAns,
        file.title,
        file.id
      );

      if (result.success) {
        toast.success(
          `Successfully generated ${result.data.totalCards} flashcards!`,
          {
            duration: 5000,
          }
        );

        console.log("🃏 Generated flashcard deck:", result.data);

        // Create practice session for the newly created deck
        const deckId = result.data.deckId;
        if (deckId) {
          try {
            const sessionResult = await flashcardAPI.createPracticeSession(
              deckId,
              "all_cards"
            );

            if (sessionResult?.success && sessionResult.data?.sessionId) {
              // Redirect to practice session using the modern UI
              router.push(`/practice/${sessionResult.data.sessionId}`);
            } else {
              throw new Error(
                sessionResult?.message || "Failed to create practice session"
              );
            }
          } catch (sessionError) {
            console.error("Failed to create practice session:", sessionError);
            toast.error("Failed to start practice session");

            // Fallback: store in sessionStorage and use old flow (will be removed later)
            const flashcardData = {
              flashcards: result.data.flashcards || [],
              title: file.title,
              fileId: file.id,
              qsAns: qsAnsData.qsAns,
            };

            sessionStorage.setItem(
              "currentFlashcards",
              JSON.stringify(flashcardData)
            );

            router.push("/assistant/flashcards");
          }
        } else {
          toast.error("No deck ID returned from flashcard generation");
        }
      } else {
        toast.error(`Failed to generate flashcards: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Generate flashcards error:", error);
      toast.error(`Failed to generate flashcards: ${error.message}`);
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGeneratePodcast = async (file: FileItem) => {
    // Check if we have Q&A data for this file (which means we have extracted text)
    const qsAnsData = extractedQsAns.get(file.id);

    if (!qsAnsData || !qsAnsData.extractedText) {
      toast.error("Please extract PDF text first to generate podcast");
      return;
    }

    // Show consent confirmation
    const userConsent = window.confirm(
      "By generating this podcast, you confirm that you have the rights to convert and distribute this document's content as audio. Do you want to proceed?"
    );

    if (!userConsent) {
      return;
    }

    try {
      setGeneratingPodcast(true);

      toast.info(`Generating podcast from "${file.title}"...`, {
        duration: 3000,
      });

      console.log("🎙️ Starting podcast generation for file:", file.id);

      // Generate podcast using the extracted text
      const result = await podcastAPI.generatePodcast({
        text: qsAnsData.extractedText,
        title: `${file.title} - StudySync Podcast`,
        lang: "en",
      });

      if (result.success && result.episodeId) {
        toast.success(
          `Successfully generated podcast! Duration: ${Math.round(
            result.duration || 0
          )}s`,
          {
            duration: 5000,
          }
        );

        console.log("🎵 Generated podcast:", result);

        // Store podcast data to show player
        setPodcastData({
          episodeId: result.episodeId,
          audioUrl: result.audioUrl || "",
          downloadUrl: result.audioUrl || "",
          chapters: result.chapters || [],
          title: result.title || file.title,
          fileId: file.id,
          demoMode: result.demoMode || false, // Flag from API response
          textChunks: result.textChunks || [], // Text content for each chapter
          extractedText: qsAnsData.extractedText, // Full text for TTS
        });
      } else {
        throw new Error(result.error || "Failed to generate podcast");
      }
    } catch (error: any) {
      console.error("Generate podcast error:", error);
      toast.error(`Failed to generate podcast: ${error.message}`);
    } finally {
      setGeneratingPodcast(false);
    }
  };

  const startGeneration = async () => {
    console.log("🚀 Starting flashcard generation...");
    console.log("Generating file:", generatingFile);
    console.log("Generation options:", generationOptions);

    if (!user) {
      console.error("❌ User not authenticated");
      toast.error("Please log in to generate flashcards");
      return;
    }

    if (!generatingFile) {
      console.error("❌ No generating file selected");
      toast.error("No file selected for generation");
      return;
    }

    if (!generationOptions.deckTitle.trim()) {
      console.error("❌ No deck title provided");
      toast.error("Please enter a deck title");
      return;
    }

    try {
      console.log("📡 Calling API...");
      console.log("User:", user);
      console.log("File ID:", generatingFile.id);
      console.log("Options:", generationOptions);

      const result = await generationAPI.generateFlashcardsFromFile(
        generatingFile.id,
        generationOptions
      );

      console.log("✅ API response:", result);

      setShowGenerationDialog(false);
      setGeneratingFile(null);

      // For mock response, redirect immediately to flashcards
      if (result.data.status === "completed") {
        const cardsGenerated = result.data.cardsGenerated || 10;
        const deckId = result.data.deckId;

        toast.success(
          `🎉 Flashcards ready! Generated ${cardsGenerated} cards`,
          {
            description: "Click to view your new flashcard deck",
            duration: 8000,
            action: {
              label: "View Flashcards",
              onClick: () => {
                if (deckId) {
                  router.push(`/flashcards/deck/${deckId}`);
                } else {
                  toast.info("Mock: Redirecting to flashcard deck...");
                }
              },
            },
          }
        );

        // Auto-redirect after 3 seconds
        setTimeout(() => {
          if (deckId) {
            router.push(`/flashcards/deck/${deckId}`);
          }
        }, 3000);
      } else {
        // Start job tracking for real jobs
        const jobId = result.data.jobId;
        const jobInfo = {
          id: jobId,
          fileName: generatingFile.title,
          deckTitle: generationOptions.deckTitle,
          status: result.data.status,
          startTime: new Date(),
        };

        // Add to active jobs
        setActiveJobs((prev) => new Map(prev.set(jobId, jobInfo)));

        toast.success(`Flashcard generation started! Job ID: ${jobId}`, {
          description: "We'll notify you when the flashcards are ready.",
          duration: 5000,
          action: {
            label: "View Jobs",
            onClick: () => setShowJobsDialog(true),
          },
        });

        // Start polling for job status
        pollJobStatus(jobId);
      }
    } catch (error: any) {
      console.error("❌ Generation error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Failed to start flashcard generation";

      // Handle specific error cases
      if (error.response?.status === 409) {
        errorMessage =
          error.response.data?.message ||
          "A generation job is already in progress for this document";
        // If there's a jobId, we could offer to check status
        if (error.response.data?.jobId) {
          toast.error(errorMessage, {
            description: `Job ID: ${error.response.data.jobId}`,
            duration: 8000,
          });
          return;
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in to generate flashcards";
        router.push(
          "/auth?redirect=" + encodeURIComponent(window.location.pathname)
        );
        return;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const pollJobStatus = async (jobId: number) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5s intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const result = await generationAPI.getJobStatus(jobId);

        if (result.success) {
          const job = result.data;

          // Update job in active jobs
          setActiveJobs((prev) => {
            const updated = new Map(prev);
            const existingJob = updated.get(jobId);
            if (existingJob) {
              updated.set(jobId, { ...existingJob, ...job });
            }
            return updated;
          });

          if (job.status === "completed") {
            // Job completed successfully
            setActiveJobs((prev) => {
              const updated = new Map(prev);
              updated.delete(jobId);
              return updated;
            });

            toast.success(
              `🎉 Flashcards ready! Generated ${job.cardsGenerated} cards`,
              {
                description: `Click to view "${job.documentTitle}" flashcards`,
                duration: 10000,
                action: {
                  label: "View Flashcards",
                  onClick: () => {
                    if (job.deckId) {
                      router.push(`/flashcards/deck/${job.deckId}`);
                    } else {
                      toast.info("Redirecting to flashcard deck...");
                    }
                  },
                },
              }
            );
            return;
          } else if (job.status === "failed") {
            // Job failed
            setActiveJobs((prev) => {
              const updated = new Map(prev);
              updated.delete(jobId);
              return updated;
            });

            toast.error(
              `Flashcard generation failed: ${
                job.errorMessage || "Unknown error"
              }`,
              {
                duration: 8000,
              }
            );
            return;
          }
        }

        // Continue polling if job is still in progress and we haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout
          setActiveJobs((prev) => {
            const updated = new Map(prev);
            updated.delete(jobId);
            return updated;
          });

          toast.error(
            "Generation is taking longer than expected. Please check back later.",
            {
              duration: 8000,
            }
          );
        }
      } catch (error) {
        console.error("Job polling error:", error);

        // Continue polling on error (might be temporary network issue)
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Wait longer on error
        } else {
          setActiveJobs((prev) => {
            const updated = new Map(prev);
            updated.delete(jobId);
            return updated;
          });
        }
      }
    };

    // Start polling
    setTimeout(poll, 2000); // First poll after 2 seconds
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Files</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your uploaded files
          </p>
        </div>
        <div className="flex space-x-2">
          {/* Active Jobs Indicator */}
          {activeJobs.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJobsDialog(true)}
              className="relative"
            >
              <Clock className="h-4 w-4 mr-2" />
              {activeJobs.size} Generating
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </Button>
          )}

          <Button onClick={loadFiles} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Files</DialogTitle>
                <DialogDescription>
                  Select files to upload to your document library
                </DialogDescription>
              </DialogHeader>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold">{stats.totalFiles}</p>
                </div>
                <File className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(stats.totalSize)}
                  </p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">File Types</p>
                  <p className="text-2xl font-bold">{stats.fileTypes.length}</p>
                </div>
                <Filter className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedFileType}
              onValueChange={setSelectedFileType}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word Document</SelectItem>
                <SelectItem value="txt">Text File</SelectItem>
                <SelectItem value="jpg">Image</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload_date-desc">Newest First</SelectItem>
                <SelectItem value="upload_date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Name A-Z</SelectItem>
                <SelectItem value="title-desc">Name Z-A</SelectItem>
                <SelectItem value="file_size_bytes-desc">
                  Largest First
                </SelectItem>
                <SelectItem value="file_size_bytes-asc">
                  Smallest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No files found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedFileType !== "all"
                ? "Try adjusting your search or filters"
                : "Upload your first file to get started"}
            </p>
            {!searchQuery && selectedFileType === "all" && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-sm truncate"
                        title={file.title}
                      >
                        {file.title}
                      </h3>
                      <p
                        className="text-xs text-gray-500 truncate"
                        title={file.fileName}
                      >
                        {file.fileName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Size</span>
                    <span>{formatFileSize(file.fileSize)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Uploaded</span>
                    <span>{formatDate(file.uploadDate)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Downloads</span>
                    <span>{file.downloadCount}</span>
                  </div>
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{file.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFile(file)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadFile(file.id, file.fileName)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.title}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteFile(file.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Generate Flashcards Button - MOVED TO TOP */}
                  {(() => {
                    const hasQsAns = extractedQsAns.has(file.id);
                    console.log(
                      `🔧 Debug: File ${file.id} (${file.title}) - hasQsAns: ${hasQsAns}`
                    );
                    if (hasQsAns) {
                      console.log(
                        `🔧 Debug: Q&A data for file ${file.id}:`,
                        extractedQsAns.get(file.id)
                      );
                    }
                    return hasQsAns;
                  })() && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateFlashcards(file)}
                      disabled={generatingFlashcards}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {generatingFlashcards ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating Flashcards...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Generate Flashcards
                        </>
                      )}
                    </Button>
                  )}

                  {/* Generate Podcast Button */}
                  {(() => {
                    const hasQsAns = extractedQsAns.has(file.id);
                    return (
                      hasQsAns && extractedQsAns.get(file.id)?.extractedText
                    );
                  })() && (
                    <Button
                      size="sm"
                      onClick={() => handleGeneratePodcast(file)}
                      disabled={generatingPodcast}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingPodcast ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating Podcast...
                        </>
                      ) : (
                        <>
                          <Headphones className="h-3 w-3 mr-1" />
                          Generate Podcast
                        </>
                      )}
                    </Button>
                  )}

                  {/* Extract PDF Text Button - MOVED TO BOTTOM */}
                  <Button
                    size="sm"
                    onClick={() => handleProcessPDF(file)}
                    disabled={processingFiles.has(file.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {processingFiles.has(file.id) ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3 mr-1" />
                        Extract PDF Text
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* File Details Dialog */}
      {selectedFile && (
        <Dialog
          open={!!selectedFile}
          onOpenChange={() => setSelectedFile(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getFileIcon(selectedFile.fileType)}
                <span>{selectedFile.title}</span>
              </DialogTitle>
              <DialogDescription>
                File details and information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    File Name
                  </label>
                  <p className="text-sm">{selectedFile.fileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    File Type
                  </label>
                  <p className="text-sm uppercase">{selectedFile.fileType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    File Size
                  </label>
                  <p className="text-sm">
                    {formatFileSize(selectedFile.fileSize)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Downloads
                  </label>
                  <p className="text-sm">{selectedFile.downloadCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Uploaded
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedFile.uploadDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Last Modified
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedFile.lastModified)}
                  </p>
                </div>
              </div>

              {selectedFile.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Description
                  </label>
                  <p className="text-sm mt-1">{selectedFile.description}</p>
                </div>
              )}

              {selectedFile.tags && selectedFile.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFile.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() =>
                    handleDownloadFile(selectedFile.id, selectedFile.fileName)
                  }
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{selectedFile.title}"?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleDeleteFile(selectedFile.id);
                          setSelectedFile(null);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Flashcard Generation Dialog */}
      {generatingFile && (
        <Dialog
          open={showGenerationDialog}
          onOpenChange={setShowGenerationDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span>Generate Flashcards</span>
              </DialogTitle>
              <DialogDescription>
                Generate flashcards from "{generatingFile.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="deckTitle">Deck Title</Label>
                <Input
                  id="deckTitle"
                  value={generationOptions.deckTitle}
                  onChange={(e) =>
                    setGenerationOptions({
                      ...generationOptions,
                      deckTitle: e.target.value,
                    })
                  }
                  placeholder="Enter deck title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cardType">Card Type</Label>
                <Select
                  value={generationOptions.cardType}
                  onValueChange={(value) =>
                    setGenerationOptions({
                      ...generationOptions,
                      cardType: value,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      Basic (Question & Answer)
                    </SelectItem>
                    <SelectItem value="multiple_choice">
                      Multiple Choice
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={generationOptions.targetDifficulty.toString()}
                  onValueChange={(value) =>
                    setGenerationOptions({
                      ...generationOptions,
                      targetDifficulty: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Easy</SelectItem>
                    <SelectItem value="2">2 - Easy</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - Hard</SelectItem>
                    <SelectItem value="5">5 - Very Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxCards">Maximum Cards</Label>
                <Input
                  id="maxCards"
                  type="number"
                  min="1"
                  max="100"
                  value={generationOptions.maxCards}
                  onChange={(e) =>
                    setGenerationOptions({
                      ...generationOptions,
                      maxCards: parseInt(e.target.value) || 20,
                    })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Between 1 and 100 cards
                </p>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowGenerationDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("🔘 Generate button clicked!");
                  console.log("Deck title:", generationOptions.deckTitle);
                  console.log(
                    "Button disabled:",
                    !generationOptions.deckTitle.trim()
                  );
                  startGeneration();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!generationOptions.deckTitle.trim()}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Active Jobs Dialog */}
      <Dialog open={showJobsDialog} onOpenChange={setShowJobsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Active Generation Jobs</span>
            </DialogTitle>
            <DialogDescription>
              Track your flashcard generation progress
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {Array.from(activeJobs.values()).map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{job.deckTitle}</h4>
                  <Badge variant="outline" className="text-xs">
                    Job #{job.id}
                  </Badge>
                </div>

                <p className="text-xs text-gray-600">From: {job.fileName}</p>

                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">
                    {job.status === "processing"
                      ? "Generating flashcards..."
                      : "In queue..."}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  Started: {job.startTime?.toLocaleTimeString()}
                </div>
              </div>
            ))}

            {activeJobs.size === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active generation jobs</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowJobsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Podcast Player Dialog */}
      {podcastData && (
        <Dialog open={!!podcastData} onOpenChange={() => setPodcastData(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Headphones className="h-5 w-5 text-purple-500" />
                <span>Generated Podcast</span>
              </DialogTitle>
              <DialogDescription>
                Your podcast has been generated successfully! This uses live
                text-to-speech for real audio playback. Click play to hear your
                content.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {podcastData.demoMode ? (
                <LiveTTSPlayer
                  chapters={podcastData.chapters}
                  title={podcastData.title}
                  episodeId={podcastData.episodeId}
                  textChunks={podcastData.textChunks || []}
                />
              ) : (
                <PodcastPlayer
                  audioUrl={podcastData.audioUrl}
                  chapters={podcastData.chapters}
                  title={podcastData.title}
                  episodeId={podcastData.episodeId}
                  downloadUrl={podcastData.downloadUrl}
                  demoMode={podcastData.demoMode}
                />
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  📝 Generated from:{" "}
                  {files.find((f) => f.id === podcastData.fileId)?.title ||
                    "Unknown file"}
                </div>
                <div className="text-sm text-gray-600">
                  🎵 {podcastData.chapters.length} chapters
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setPodcastData(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
