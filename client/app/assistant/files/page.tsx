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
import { fileAPI, generationAPI, flashcardAPI, documentAPI } from "@/lib/api";
import { podcastAPI } from "@/lib/podcasts";
import { useAuth } from "@/contexts/auth-context";
import FileUpload from "../components/file-upload";
import AudioPodcastPlayer from "@/components/AudioPodcastPlayer";

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
  // ✅ Per-file loading state instead of global boolean
  const [flashcardLoadingMap, setFlashcardLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [showFlashcardOptionsDialog, setShowFlashcardOptionsDialog] =
    useState(false);
  const [selectedFileForFlashcards, setSelectedFileForFlashcards] =
    useState<FileItem | null>(null);
  const [flashcardOptions, setFlashcardOptions] = useState({
    maxCards: 10,
    difficultyLevel: "medium",
  });

  // Podcast-related states
  // ✅ Per-file loading state instead of global boolean
  const [podcastLoadingMap, setPodcastLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [filePodcasts, setFilePodcasts] = useState<Map<number, any>>(new Map());
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
      let loadedFiles: FileItem[] = [];
      if (response && response.data && response.data.files) {
        loadedFiles = response.data.files || [];
        setFiles(loadedFiles);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (response && Array.isArray(response.files)) {
        loadedFiles = response.files || [];
        setFiles(loadedFiles);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        console.warn("Unexpected response structure:", response);
        setFiles([]);
        setTotalPages(1);
      }

      // Check which files have podcasts
      if (loadedFiles.length > 0) {
        checkFilesForPodcasts(loadedFiles);
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

  const checkFilesForPodcasts = async (filesToCheck: FileItem[]) => {
    const newFilePodcasts = new Map(filePodcasts);

    for (const file of filesToCheck) {
      try {
        const result = await podcastAPI.getPodcastByFileId(file.id);
        if (result.success && result.hasPodcast && result.podcast) {
          newFilePodcasts.set(file.id, result.podcast);
        }
      } catch (error) {
        // Silently fail - podcast check is not critical
        console.debug(`Failed to check podcast for file ${file.id}`);
      }
    }

    setFilePodcasts(newFilePodcasts);
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

      console.log("Extracting text from document ID:", file.id);

      // Use documentAPI.extractText instead of langchain
      const result = await documentAPI.extractText(file.id);

      if (result.success) {
        toast.success(`Successfully extracted text from "${file.title}"`, {
          description: `Extracted ${result.data.wordCount} words`,
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
    try {
      // ✅ Set loading state for THIS file only
      setFlashcardLoadingMap((prev) => ({ ...prev, [file.id]: true }));

      // Check if we have extracted text for this file
      let extractedText = extractedQsAns.get(file.id)?.extractedText;

      // If no extracted text, extract it automatically
      if (!extractedText) {
        toast.info(`Extracting text from "${file.title}"...`, {
          duration: 2000,
        });

        // Get the file download URL
        console.log("Getting download URL for file:", file.id);
        const downloadResponse = await fileAPI.downloadFile(file.id);
        const downloadData = downloadResponse.data || downloadResponse;
        const fileUrl =
          downloadData.data?.downloadUrl || downloadData.downloadUrl;
        const fileName = downloadData.data?.fileName || downloadData.fileName;

        if (!fileUrl) {
          throw new Error("Could not get file download URL");
        }

        // Extract text directly using documentAPI
        const result = await documentAPI.extractText(file.id);

        if (result.success && result.data.extractedText) {
          extractedText = result.data.extractedText;
          console.log(
            `✅ Extracted ${result.data.wordCount} words from "${file.title}"`
          );

          // Store in state for future use (but don't wait for it)
          setExtractedQsAns((prev) => {
            const newMap = new Map(prev).set(file.id, {
              qsAns: result.data.qsAns || [],
              title: file.title,
              extractedText: result.data.extractedText,
            });
            return newMap;
          });
        } else {
          throw new Error(
            result.message || "Failed to extract text from document"
          );
        }
      }

      if (!extractedText || extractedText.trim().length < 100) {
        toast.error("Insufficient text content for flashcard generation");
        return;
      }

      toast.info(
        `Generating ${flashcardOptions.maxCards} ${flashcardOptions.difficultyLevel} flashcards from "${file.title}"...`,
        {
          duration: 3000,
        }
      );

      // Generate flashcards using AI with user-selected options
      const result = await documentAPI.generateFlashcards({
        text: extractedText,
        deckTitle: file.title,
        maxCards: flashcardOptions.maxCards,
        difficultyLevel: flashcardOptions.difficultyLevel,
      });

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
              qsAns: extractedQsAns.get(file.id)?.qsAns || [],
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
      // ✅ Clear loading state for THIS file only
      setFlashcardLoadingMap((prev) => ({ ...prev, [file.id]: false }));
    }
  };

  const handleGeneratePodcast = async (file: FileItem) => {
    try {
      // ✅ Set loading state for THIS file only
      setPodcastLoadingMap((prev) => ({ ...prev, [file.id]: true }));

      // Check if we have Q&A data for this file (which means we have extracted text)
      let qsAnsData = extractedQsAns.get(file.id);

      // If no extracted text, extract it automatically (silently)
      if (!qsAnsData || !qsAnsData.extractedText) {
        // Get the file download URL
        console.log("Auto-extracting text for podcast generation:", file.id);
        const downloadResponse = await fileAPI.downloadFile(file.id);
        const downloadData = downloadResponse.data || downloadResponse;
        const fileUrl =
          downloadData.data?.downloadUrl || downloadData.downloadUrl;
        const fileName = downloadData.data?.fileName || downloadData.fileName;

        if (!fileUrl) {
          throw new Error("Could not get file download URL");
        }

        // Extract text directly using documentAPI
        const result = await documentAPI.extractText(file.id);

        if (result.success && result.data.extractedText) {
          // Store in state for future use
          qsAnsData = {
            qsAns: result.data.qsAns || [],
            title: file.title,
            extractedText: result.data.extractedText,
          };

          setExtractedQsAns((prev) => {
            const newMap = new Map(prev).set(file.id, qsAnsData!);
            return newMap;
          });

          console.log(
            `✅ Auto-extracted ${result.data.wordCount} words for podcast`
          );
        } else {
          throw new Error(
            result.message || "Failed to extract text from document"
          );
        }
      }

      // Show consent confirmation
      const userConsent = window.confirm(
        "By generating this podcast, you confirm that you have the rights to convert and distribute this document's content as audio. Do you want to proceed?"
      );

      if (!userConsent) {
        // Clear loading state if user cancels
        setPodcastLoadingMap((prev) => ({ ...prev, [file.id]: false }));
        return;
      }

      toast.info(`Generating podcast from "${file.title}"...`, {
        duration: 3000,
      });

      console.log("🎙️ Starting podcast generation for file:", file.id);

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error("User authentication required");
      }

      // Create podcast using the new API
      const result = await podcastAPI.createPodcast({
        text: qsAnsData.extractedText,
        title: `${file.title} - StudySync Podcast`,
        userId: String(user.id),
        fileId: String(file.id),
        lang: "en",
      });

      if (result.success && result.podcastId) {
        toast.success("Podcast created! Generating audio...", {
          duration: 3000,
        });

        console.log("🎵 Podcast created:", result);

        // Poll for podcast completion
        toast.info("Waiting for audio generation to complete...");

        const podcast = await podcastAPI.pollPodcastStatus(result.podcastId);

        if (podcast?.status === "ready") {
          toast.success("Podcast ready to play!", {
            duration: 5000,
          });

          // Add podcast to filePodcasts map
          const newFilePodcasts = new Map(filePodcasts);
          newFilePodcasts.set(file.id, podcast);
          setFilePodcasts(newFilePodcasts);

          // Store podcast data to show player
          setPodcastData({
            episodeId: podcast.id,
            audioUrl: podcast.audio_url || "",
            downloadUrl: podcast.audio_url || "",
            chapters: [],
            title: podcast.title,
            fileId: file.id,
            demoMode: false,
            textChunks: [],
            extractedText: qsAnsData.extractedText,
          });
        } else if (podcast?.status === "failed") {
          throw new Error(podcast.error_message || "Podcast generation failed");
        } else {
          throw new Error("Podcast generation timed out");
        }
      } else {
        throw new Error(result.error || "Failed to create podcast");
      }
    } catch (error: any) {
      console.error("Generate podcast error:", error);
      toast.error(`Failed to generate podcast: ${error.message}`);
    } finally {
      // ✅ Clear loading state for THIS file only
      setPodcastLoadingMap((prev) => ({ ...prev, [file.id]: false }));
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Documents
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and transform your study materials
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Active Jobs Indicator */}
            {activeJobs.size > 0 && (
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowJobsDialog(true)}
                className="relative border-blue-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">
                  {activeJobs.size} Processing
                </span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
              </Button>
            )}

            <Button
              onClick={loadFiles}
              variant="outline"
              size="default"
              className="hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                  <DialogDescription>
                    Upload PDFs, Word documents, or text files to get started
                  </DialogDescription>
                </DialogHeader>
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-700">
                      Total Documents
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.totalFiles}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <File className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-700">
                      Storage Used
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatFileSize(stats.totalSize)}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <FileSpreadsheet className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-700">
                      File Types
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {stats.fileTypes.length}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Filter className="h-7 w-7 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search documents by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Select
                value={selectedFileType}
                onValueChange={setSelectedFileType}
              >
                <SelectTrigger className="w-full md:w-56 h-12 border-gray-200">
                  <SelectValue placeholder="All File Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All File Types</SelectItem>
                  <SelectItem value="pdf">📄 PDF Documents</SelectItem>
                  <SelectItem value="docx">📝 Word Documents</SelectItem>
                  <SelectItem value="txt">📃 Text Files</SelectItem>
                  <SelectItem value="jpg">🖼️ Images</SelectItem>
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
                <SelectTrigger className="w-full md:w-56 h-12 border-gray-200">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload_date-desc">
                    📅 Newest First
                  </SelectItem>
                  <SelectItem value="upload_date-asc">
                    📅 Oldest First
                  </SelectItem>
                  <SelectItem value="title-asc">🔤 Name A-Z</SelectItem>
                  <SelectItem value="title-desc">🔤 Name Z-A</SelectItem>
                  <SelectItem value="file_size_bytes-desc">
                    📊 Largest First
                  </SelectItem>
                  <SelectItem value="file_size_bytes-asc">
                    📊 Smallest First
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Files Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading your documents...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                  <File className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No documents found
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {searchQuery || selectedFileType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload your first document to start transforming it into study materials"}
                </p>
                {!searchQuery && selectedFileType === "all" && (
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Upload Your First Document
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Card Header with Icon */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="h-14 w-14 rounded-xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-bold text-lg text-gray-900 truncate mb-1"
                            title={file.title}
                          >
                            {file.title}
                          </h3>
                          <p
                            className="text-sm text-gray-600 truncate"
                            title={file.fileName}
                          >
                            {file.fileName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* File Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Size</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Download className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Downloads</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {file.downloadCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        Uploaded {formatDate(file.uploadDate)}
                      </p>
                    </div>

                    {/* Tags */}
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {file.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{file.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFile(file)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownloadFile(file.id, file.fileName)
                          }
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{file.title}"?
                                This action cannot be undone.
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

                      {/* Generate Flashcards Button - Always visible */}
                      <Button
                        size="default"
                        onClick={() => {
                          setSelectedFileForFlashcards(file);
                          setShowFlashcardOptionsDialog(true);
                        }}
                        disabled={flashcardLoadingMap[file.id]}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                      >
                        {flashcardLoadingMap[file.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Flashcards...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Generate Flashcards
                          </>
                        )}
                      </Button>

                      {/* Generate Podcast Button - Always visible */}
                      {(() => {
                        const hasPodcast = filePodcasts.has(file.id);
                        const podcast = filePodcasts.get(file.id);

                        // If podcast exists, show "View Podcast" button
                        if (hasPodcast && podcast) {
                          return (
                            <Button
                              size="default"
                              onClick={() => {
                                router.push(
                                  `/assistant/podcasts?highlight=${podcast.id}`
                                );
                              }}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                            >
                              <Headphones className="h-4 w-4 mr-2" />
                              {podcast.status === "ready" && "View Podcast"}
                              {podcast.status === "pending" &&
                                "Podcast Generating..."}
                              {podcast.status === "failed" &&
                                "Podcast Failed - Retry"}
                            </Button>
                          );
                        }

                        // Otherwise, show "Generate Podcast" button
                        return (
                          <Button
                            size="default"
                            onClick={() => handleGeneratePodcast(file)}
                            disabled={podcastLoadingMap[file.id]}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                          >
                            {podcastLoadingMap[file.id] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Podcast...
                              </>
                            ) : (
                              <>
                                <Headphones className="h-4 w-4 mr-2" />
                                Generate Podcast
                              </>
                            )}
                          </Button>
                        );
                      })()}
                    </div>
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
                          Are you sure you want to delete "{selectedFile.title}
                          "? This action cannot be undone.
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
              <Button
                variant="outline"
                onClick={() => setShowJobsDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Podcast Player Dialog */}
        {podcastData && (
          <Dialog
            open={!!podcastData}
            onOpenChange={() => setPodcastData(null)}
          >
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Headphones className="h-5 w-5 text-purple-500" />
                  <span>Generated Podcast</span>
                </DialogTitle>
                <DialogDescription>
                  Your podcast has been generated successfully! This uses live
                  text-to-speech for real audio playback. Click play to hear
                  your content.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <AudioPodcastPlayer
                  audioUrl={podcastData.audioUrl}
                  title={podcastData.title}
                  podcastId={podcastData.episodeId}
                />

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    📝 Generated from:{" "}
                    {files.find((f) => f.id === podcastData.fileId)?.title ||
                      "Unknown file"}
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

        {/* Flashcard Options Dialog */}
        {selectedFileForFlashcards && (
          <Dialog
            open={showFlashcardOptionsDialog}
            onOpenChange={setShowFlashcardOptionsDialog}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <span>Flashcard Generation Options</span>
                </DialogTitle>
                <DialogDescription>
                  Customize your flashcards for "
                  {selectedFileForFlashcards.title}"
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxCards">Number of Flashcards</Label>
                  <Select
                    value={flashcardOptions.maxCards.toString()}
                    onValueChange={(value) =>
                      setFlashcardOptions({
                        ...flashcardOptions,
                        maxCards: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 flashcards</SelectItem>
                      <SelectItem value="10">10 flashcards</SelectItem>
                      <SelectItem value="15">15 flashcards</SelectItem>
                      <SelectItem value="20">20 flashcards</SelectItem>
                      <SelectItem value="30">30 flashcards</SelectItem>
                      <SelectItem value="40">40 flashcards</SelectItem>
                      <SelectItem value="50">50 flashcards</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select how many flashcards to generate from the document
                  </p>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={flashcardOptions.difficultyLevel}
                    onValueChange={(value) =>
                      setFlashcardOptions({
                        ...flashcardOptions,
                        difficultyLevel: value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        Easy - Simple recall questions
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium - Balanced challenge
                      </SelectItem>
                      <SelectItem value="hard">
                        Hard - Complex concepts
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the complexity level of questions
                  </p>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFlashcardOptionsDialog(false);
                    setSelectedFileForFlashcards(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowFlashcardOptionsDialog(false);
                    handleGenerateFlashcards(selectedFileForFlashcards);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
