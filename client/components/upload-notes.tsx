"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Cloud,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, notesAPI } from "@/lib/api";

interface AlertState {
  show: boolean;
  type: "success" | "error" | "";
  message: string;
}

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
}

export default function UploadNotes() {
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCourse, setUploadCourse] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "",
    message: "",
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await notesAPI.getCourses();
        if (response.success) {
          setCourses(response.data);
          console.log(response.data);
        } else {
          console.error("Failed to fetch courses:", response.message);
          showAlert(
            "error",
            "Failed to load courses. Please refresh the page."
          );
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        showAlert(
          "error",
          "Failed to load courses. Please check your internet connection."
        );
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Supported file types and max size
  const SUPPORTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const validateFile = (file: File): boolean => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      showAlert(
        "error",
        "File type not supported. Please upload PDF, DOCX, or TXT files only."
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showAlert(
        "error",
        "File size exceeds 50MB limit. Please choose a smaller file."
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      showAlert("success", `File "${file.name}" selected successfully!`);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    // Validation
    if (!selectedFile) {
      showAlert("error", "Please select a file to upload.");
      return;
    }

    if (!uploadTitle.trim()) {
      showAlert("error", "Please enter a title for your notes.");
      return;
    }

    if (!uploadCourse) {
      showAlert("error", "Please select a course.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadTitle.trim());
      formData.append("course", uploadCourse);
      formData.append("description", uploadDescription.trim());
      formData.append("visibility", visibility);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiRequest.post("/notes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        showAlert("success", "Notes uploaded successfully!");

        // Reset form
        setUploadTitle("");
        setUploadCourse("");
        setUploadDescription("");
        setVisibility("public");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      showAlert(
        "error",
        error.response?.data?.message ||
          error.message ||
          "Failed to upload notes. Please try again."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileTypeFromName = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "pdf";
      case "docx":
        return "docx";
      case "txt":
        return "txt";
      default:
        return "unknown";
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upload Your Notes
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Share your lecture notes with fellow students and help them succeed.
        </p>
      </div>

      {/* Alert */}
      {alert.show && (
        <Alert
          className={`max-w-2xl mx-auto ${
            alert.type === "error"
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          {alert.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription
            className={
              alert.type === "error" ? "text-red-800" : "text-green-800"
            }
          >
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Module */}
      <Card className="bg-blue-50 border-blue-200 max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* File Input */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center bg-white transition-colors ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : selectedFile
                  ? "border-green-300 bg-green-50"
                  : "border-blue-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-8 h-8 text-green-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                        {getFileTypeFromName(selectedFile.name).toUpperCase()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="ml-4"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Cloud className="w-12 h-12 text-blue-400 mx-auto" />
                  <div>
                    <p className="text-gray-700 mb-2">
                      Drag and drop your file here
                    </p>
                    <p className="text-gray-500 mb-4">or click to browse</p>
                  </div>
                  <Button
                    variant="outline"
                    className="mx-auto bg-blue-600 hover:bg-blue-700 text-white "
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Supported Formats */}
            <p className="text-sm text-gray-500 text-center">
              Supported formats: PDF, DOCX, TXT (Max 50MB)
            </p>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Add a descriptive title for your notes"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="bg-white"
                disabled={isUploading}
              />
            </div>

            {/* Course Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select
                value={uploadCourse}
                onValueChange={setUploadCourse}
                disabled={isUploading || coursesLoading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue
                    placeholder={
                      coursesLoading ? "Loading courses..." : "Select a course"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-60">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.course_code}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a brief description of your notes content..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="bg-white min-h-[80px]"
                disabled={isUploading}
              />
            </div>

            {/* Visibility Options */}
            <div className="space-y-3">
              <Label>Visibility</Label>
              <RadioGroup
                value={visibility}
                onValueChange={setVisibility}
                disabled={isUploading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">
                    Public - Anyone can view and download
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="course_only" id="course_only" />
                  <Label htmlFor="course_only">
                    Course Only - Only students in this course can view
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Private - Only you can view</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Button */}
            <Button
              className={`w-full text-white ${
                isUploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={handleUpload}
              disabled={
                isUploading ||
                !selectedFile ||
                !uploadTitle.trim() ||
                !uploadCourse
              }
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Notes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
