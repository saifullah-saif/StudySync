"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardsPanel } from "@/components/FlashcardsPanel";
import FileUpload from "../components/file-upload";

interface QsAnsItem {
  question: string;
  answer: string;
}

interface FileItem {
  id: number;
  name: string;
  url: string;
}

export default function FlashcardTestPage() {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  // Sample data for quick testing
  const sampleData: QsAnsItem[] = [
    {
      question: "What is photosynthesis?",
      answer:
        "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
    },
    {
      question: "What are the two main types of photosynthesis?",
      answer:
        "The two main types are C3 photosynthesis (most common) and C4 photosynthesis (more efficient in hot, dry conditions).",
    },
    {
      question: "Where does photosynthesis occur in plant cells?",
      answer:
        "Photosynthesis occurs in the chloroplasts, specifically in structures called thylakoids within the chloroplasts.",
    },
    {
      question: "What is the chemical equation for photosynthesis?",
      answer: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
    },
    {
      question: "What role does chlorophyll play in photosynthesis?",
      answer:
        "Chlorophyll is the green pigment that absorbs light energy, primarily red and blue wavelengths, which powers the photosynthesis process.",
    },
  ];

  const handleFileUploadSuccess = (file: any) => {
    console.log("File uploaded successfully:", file);
    setSelectedFileId(file.id);
  };

  const handleFileUploadError = (error: string) => {
    console.error("File upload error:", error);
  };

  const handleFlashcardsGenerated = (flashcards: any[]) => {
    console.log("Flashcards generated:", flashcards);
  };

  const handleSaveFlashcards = (flashcards: any[]) => {
    console.log("Save flashcards:", flashcards);
    alert("Save functionality called! Check console for data.");
  };

  const handleEditFlashcard = (cardId: string, newData: any) => {
    console.log("Edit flashcard:", cardId, newData);
    alert("Edit functionality called! Check console for data.");
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Flashcard UI Test Page
        </h1>
        <p className="text-gray-600">
          Test the FlashcardsPanel component by uploading a file
        </p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>File Upload & Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUploadSuccess={handleFileUploadSuccess}
            onUploadError={handleFileUploadError}
            maxFileSize={15}
            multiple={false}
          />
        </CardContent>
      </Card>

      {/* FlashcardsPanel Component */}
      {selectedFileId && (
        <div className="mt-8">
          <FlashcardsPanel
            fileId={selectedFileId}
            onFlashcardsGenerated={handleFlashcardsGenerated}
            onSaveFlashcards={handleSaveFlashcards}
            onEditFlashcard={handleEditFlashcard}
            onBack={() => {
              setSelectedFileId(null);
            }}
          />
        </div>
      )}

      {!selectedFileId && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Upload a PDF, DOCX, or TXT file above to test the flashcard
              generation functionality. The FlashcardsPanel component will
              appear once a file is successfully uploaded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
