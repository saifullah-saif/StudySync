// Compact uniform list of recent files with hover actions
"use client";

import { THEME } from "@/styles/theme";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MoreHorizontal,
  Eye,
  Download,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fileAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface FileItem {
  id: number;
  title: string;
  fileName: string; // This matches what the files page uses
  fileSize: number;
  uploadDate: string;
  fileType: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentFilesList() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recent files
  const loadRecentFiles = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fileAPI.getUserFiles(
        1,
        5,
        "",
        "",
        "uploadDate",
        "desc"
      ); // Get 5 most recent files

      // Handle different possible response structures
      let filesArray = [];
      if (result && result.success && result.data && result.data.files) {
        filesArray = result.data.files;
      } else if (result && result.data && Array.isArray(result.data)) {
        filesArray = result.data;
      } else if (result && Array.isArray(result.files)) {
        filesArray = result.files;
      } else if (result && Array.isArray(result)) {
        filesArray = result;
      }

      setFiles(filesArray);
    } catch (error: any) {
      console.error("Failed to load recent files:", error);
      setError(error.message || "Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentFiles();
  }, [user]);

  // Refresh files when the component becomes visible (when navigating back from files page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadRecentFiles();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await fileAPI.downloadFile(fileId);
      if (response.data.success) {
        // Create a link element and trigger download
        const link = document.createElement("a");
        link.href = response.data.data.downloadUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (loading) {
    return (
      <div
        className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
      >
        <h2 className={`text-lg font-semibold ${THEME.text} mb-4`}>
          Recent Files
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-3 px-3 -mx-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
      >
        <h2 className={`text-lg font-semibold ${THEME.text} mb-4`}>
          Recent Files
        </h2>
        <div className="text-center py-8">
          <FileText className={`h-12 w-12 ${THEME.subtext} mx-auto mb-3`} />
          <p className={`text-sm ${THEME.subtext} mb-3`}>{error}</p>
          <Button variant="outline" size="sm" onClick={loadRecentFiles}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
    >
      <h2 className={`text-lg font-semibold ${THEME.text} mb-4`}>
        Recent Files
      </h2>

      {files.length > 0 ? (
        <>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-slate-50 transition-colors min-h-[60px]"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText
                    className={`h-4 w-4 ${THEME.subtext} flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${THEME.text} truncate`}>
                      {file.title}
                    </p>
                    <p className={`text-xs ${THEME.subtext}`}>
                      {formatFileSize(file.fileSize)} •{" "}
                      {formatDate(file.uploadDate)}
                    </p>
                  </div>
                </div>

                {/* Actions - visible on hover */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    aria-label={`View ${file.title}`}
                    onClick={() => window.open(`/files/${file.id}`, "_blank")}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    aria-label={`Download ${file.title}`}
                    onClick={() => handleDownload(file.id, file.fileName)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link href="/assistant/files">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full ${THEME.subtext} hover:${THEME.text} focus:outline-none focus:ring-2 focus:ring-sky-400`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View all files
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <FileText className={`h-12 w-12 ${THEME.subtext} mx-auto mb-3`} />
          <p className={`text-sm ${THEME.subtext} mb-3`}>
            No files uploaded yet
          </p>
          <Link href="/assistant?tab=files">
            <Button variant="outline" size="sm">
              Upload Your First File
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
