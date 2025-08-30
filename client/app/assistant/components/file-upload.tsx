"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fileAPI } from "@/lib/api";

interface FileUploadProps {
  onUploadSuccess?: (file: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  multiple?: boolean;
  maxFiles?: number; // Maximum number of files that can be uploaded at once
}

interface UploadingFile {
  file: File;
  title: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  id?: number;
}

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 15,
  acceptedFileTypes = [
    ".pdf",
    ".docx",
    ".txt",
    ".doc",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ],
  multiple = true,
  maxFiles = 10,
}: FileUploadProps) {
  const router = useRouter();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);

      // Check if adding these files would exceed the maximum
      if (uploadingFiles.length + fileArray.length > maxFiles) {
        const errorMsg = `Cannot upload more than ${maxFiles} files at once. Currently have ${uploadingFiles.length} files.`;
        toast.error(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      // Validate files
      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        // Check if file name is empty or too long
        if (!file.name || file.name.trim().length === 0) {
          errors.push("File name cannot be empty");
          return;
        }

        if (file.name.length > 255) {
          errors.push(
            `File name "${file.name}" is too long (max 255 characters)`
          );
          return;
        }

        // Check file size
        if (file.size === 0) {
          errors.push(`File "${file.name}" is empty`);
          return;
        }

        if (file.size > maxFileSize * 1024 * 1024) {
          errors.push(
            `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB`
          );
          return;
        }

        // Check file type - support both PDF, DOCX, TXT for flashcard generation
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const supportedTypes = [".pdf", ".docx", ".txt"];

        if (!fileExtension || fileExtension === ".") {
          errors.push(`File "${file.name}" has no extension`);
          return;
        }

        if (!supportedTypes.includes(fileExtension)) {
          errors.push(
            `File type ${fileExtension} is not supported. Supported types: PDF, DOCX, TXT`
          );
          return;
        }

        // Check for duplicate file names in current upload batch
        const isDuplicate =
          validFiles.some((existingFile) => existingFile.name === file.name) ||
          uploadingFiles.some(
            (existingFile) => existingFile.file.name === file.name
          );

        if (isDuplicate) {
          errors.push(`File "${file.name}" is already in the upload queue`);
          return;
        }

        validFiles.push(file);
      });

      // Show all errors at once
      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
        onUploadError?.(errors.join("; "));
      }

      if (validFiles.length === 0) return;

      // Add valid files to uploading list
      const newFiles: UploadingFile[] = validFiles.map((file) => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default title
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Start uploading files
      newFiles.forEach((uploadingFile, index) => {
        uploadFile(uploadingFile, index + uploadingFiles.length);
      });
    },
    [uploadingFiles.length, maxFileSize, acceptedFileTypes]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (uploadingFile: UploadingFile, index: number) => {
    setIsUploading(true);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === index && f.status === "uploading"
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const result = await fileAPI.uploadFile(
        uploadingFile.file,
        uploadingFile.title
      );

      clearInterval(progressInterval);

      // Update file status to success
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                progress: 100,
                status: "success" as const,
                id: result.data.id,
              }
            : f
        )
      );

      toast.success(`File "${uploadingFile.title}" uploaded successfully!`);
      onUploadSuccess?.(result.data);
    } catch (error: any) {
      // Determine error message
      let errorMessage = "Upload failed";

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 413) {
          errorMessage = "File is too large";
        } else if (error.response.status === 415) {
          errorMessage = "File type not supported";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication required";
        } else if (error.response.status === 403) {
          errorMessage = "Access denied";
        } else if (error.response.status === 429) {
          errorMessage = "Too many requests. Please try again later";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection";
      } else if (error.message) {
        // Other error
        errorMessage = error.message;
      }

      // Update file status to error
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error" as const,
                error: errorMessage,
                progress: 0, // Reset progress on error
              }
            : f
        )
      );

      toast.error(`Failed to upload "${uploadingFile.title}": ${errorMessage}`);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileTitle = (index: number, newTitle: string) => {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, title: newTitle } : f))
    );
  };

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const retryUpload = (index: number) => {
    const file = uploadingFiles[index];
    if (file && file.status === "error") {
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "uploading", progress: 0, error: undefined }
            : f
        )
      );
      uploadFile(file, index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragOver ? (
              <p className="text-blue-600 font-medium">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports: PDF, DOCX, TXT (max {maxFileSize}MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Uploading Files</h3>
            <div className="space-y-4">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {uploadingFile.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(uploadingFile.file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadingFile.status === "uploading" && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {uploadingFile.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadingFile.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="mb-3">
                    <Label htmlFor={`title-${index}`} className="text-sm">
                      Title
                    </Label>
                    <Input
                      id={`title-${index}`}
                      value={uploadingFile.title}
                      onChange={(e) => updateFileTitle(index, e.target.value)}
                      disabled={uploadingFile.status === "uploading"}
                      className="mt-1"
                    />
                  </div>

                  {/* Progress Bar */}
                  {uploadingFile.status === "uploading" && (
                    <div className="mb-3">
                      <Progress
                        value={uploadingFile.progress}
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {uploadingFile.progress}% uploaded
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadingFile.status === "error" && (
                    <Alert className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {uploadingFile.error}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => retryUpload(index)}
                          className="ml-2 p-0 h-auto"
                        >
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {uploadingFile.status === "success" && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        File uploaded successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show All Files Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() => router.push("/assistant/files")}
          className="w-full"
        >
          <File className="h-4 w-4 mr-2" />
          Show All Files
        </Button>
      </div>
    </div>
  );
}
