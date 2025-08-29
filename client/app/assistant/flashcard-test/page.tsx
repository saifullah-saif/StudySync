"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FlashcardsPanel from "@/components/FlashcardsPanel";
import StudyFlashcards, { StudyFlashcard } from "@/components/StudyFlashcards";
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
  const [studyMode, setStudyMode] = useState(false);

  // Sample data for quick testing
  const sampleData: StudyFlashcard[] = [
    {
      id: "1",
      question: "What is photosynthesis?",
      answer:
        "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
      shownAnswer: false,
      result: null,
    },
    {
      id: "2",
      question: "What are the two main types of photosynthesis?",
      answer:
        "The two main types are C3 photosynthesis (most common) and C4 photosynthesis (more efficient in hot, dry conditions).",
      shownAnswer: false,
      result: null,
    },
    {
      id: "3",
      question: "Where does photosynthesis occur in plant cells?",
      answer:
        "Photosynthesis occurs in the chloroplasts, specifically in structures called thylakoids within the chloroplasts.",
      shownAnswer: false,
      result: null,
    },
    {
      id: "4",
      question: "What is the chemical equation for photosynthesis?",
      answer: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      shownAnswer: false,
      result: null,
    },
    {
      id: "5",
      question: "What role does chlorophyll play in photosynthesis?",
      answer:
        "Chlorophyll is the green pigment that absorbs light energy, primarily red and blue wavelengths, which powers the photosynthesis process.",
      shownAnswer: false,
      result: null,
    },
  ];

  const handleFileUploadSuccess = (file: any) => {
    console.log("File uploaded successfully:", file);
    setSelectedFileId(file.id);
  };

  const handleFileUploadError = (error: string) => {
    console.error("File upload error:", error);
  };

  const handleStudyFinish = (summary: {
    total: number;
    correct: number;
    incorrect: number;
  }) => {
    console.log("Study session finished:", summary);
    alert(
      `Study completed! ${summary.correct}/${
        summary.total
      } correct (${Math.round((summary.correct / summary.total) * 100)}%)`
    );
    setStudyMode(false);
  };

  const handleStudyQuit = () => {
    setStudyMode(false);
  };

  if (studyMode) {
    return (
      <StudyFlashcards
        flashcards={sampleData}
        title="Photosynthesis Study Deck"
        onQuit={handleStudyQuit}
        onFinish={handleStudyFinish}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Flashcard UI Test Page
        </h1>
        <p className="text-gray-600">
          Test the FlashcardsPanel component by uploading a file or test the new
          Study Mode
        </p>
      </div>

      {/* Study Mode Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>🎓 Study Mode Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Test the new card-by-card study mode with sample photosynthesis
            flashcards.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Features to test:</p>
            <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
              <li>One card at a time display</li>
              <li>Show Answer → Make Right/Mark Wrong flow</li>
              <li>Auto-advance after 1 second</li>
              <li>Progress tracking and summary</li>
              <li>
                Keyboard shortcuts (Q=quit, Space=show answer, R=right, W=wrong)
              </li>
              <li>Accessibility features and reduced motion support</li>
            </ul>
          </div>
          <Button onClick={() => setStudyMode(true)} className="w-full">
            🚀 Start Study Mode Test (5 cards)
          </Button>
        </CardContent>
      </Card>

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
            onSave={(deckId) => {
              console.log("Deck saved with ID:", deckId);
              alert("Save functionality called! Deck ID: " + deckId);
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
            <p className="text-gray-600">You can either:</p>
            <ul className="text-gray-600 list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Test Study Mode:</strong> Use the sample data above for
                immediate testing
              </li>
              <li>
                <strong>Test File Processing:</strong> Upload a PDF, DOCX, or
                TXT file to test the flashcard generation functionality
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
