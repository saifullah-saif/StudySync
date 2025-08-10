"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Play, Volume2 } from "lucide-react"

export default function AssistantPage() {
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  })
  const [selectedTab, setSelectedTab] = useState("document")
  const [textContent, setTextContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

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
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mx-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="flashcards">Create Flashcards</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Main Title Block */}
            <Card className="bg-white max-w-2xl mx-auto text-center">
              <CardContent className="pt-8 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Flashcards Generator</h1>
                <p className="text-gray-600">
                  Gamify your study. Turn your notes into flashcards and maintain your streak.
                </p>
              </CardContent>
            </Card>

            {/* User Statistics Block */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">welcome</p>
                  <h2 className="text-2xl font-bold text-gray-900">MEDHA</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <Card className="bg-white">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Streak</h3>
                      <p className="text-3xl font-bold text-blue-600">10</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Flashcard reviewed</h3>
                      <p className="text-3xl font-bold text-blue-600">28</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Accuracy(%)</h3>
                      <p className="text-3xl font-bold text-blue-600">85</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Level: 3</span>
                    <span className="text-sm text-gray-500">75%</span>
                  </div>
                  <Progress value={75} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Daily Streak Block */}
            <Card className="bg-white max-w-md mx-auto text-center">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Day 10</h3>
                <p className="text-gray-600 mb-6">Time remaining to maintain daily streak</p>

                <div className="text-4xl font-bold text-green-600 mb-6 font-mono">
                  {String(timeRemaining.hours).padStart(2, "0")}H {String(timeRemaining.minutes).padStart(2, "0")}M{" "}
                  {String(timeRemaining.seconds).padStart(2, "0")}S
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-semibold rounded-lg">
                  START
                </Button>
              </CardContent>
            </Card>

            {/* History Component Block */}
            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">History Component</h3>
                <p className="text-gray-600">
                  This component will display the history of flashcard reviewed of each day for.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Flashcard Content Input</h1>
              <p className="text-gray-600">Upload a document or paste your text to generate flashcards</p>
            </div>

            <Card className="max-w-2xl mx-auto">
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
                      selectedTab === "text" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                      <p className="text-gray-700 mb-4">Drag and drop your files or upload from computer</p>
                      <div className="flex items-center justify-center gap-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Button className="bg-blue-600 hover:bg-blue-700">Choose file</Button>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <span className="text-gray-500">{selectedFile ? selectedFile.name : "No file chosen"}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg font-semibold"
                      disabled={!selectedFile}
                    >
                      NEXT
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
                      NEXT
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Podcasts Tab */}
          <TabsContent value="podcasts" className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Podcast Generator</h1>
              <p className="text-gray-600">Transform your notes into AI-generated audio lectures</p>
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
                      selectedTab === "text" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                      <p className="text-gray-700 mb-4">Drag and drop your files or upload from computer</p>
                      <div className="flex items-center justify-center gap-4">
                        <label htmlFor="podcast-file-upload" className="cursor-pointer">
                          <Button className="bg-blue-600 hover:bg-blue-700">Choose file</Button>
                          <input
                            id="podcast-file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <span className="text-gray-500">{selectedFile ? selectedFile.name : "No file chosen"}</span>
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
              <h2 className="text-2xl font-semibold mb-6 text-center">Your Podcast Library</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {podcasts.map((podcast) => (
                  <Card key={podcast.id} className="bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{podcast.title}</h3>
                            <p className="text-sm text-gray-600">
                              {podcast.course} • {podcast.duration}
                            </p>
                            <p className="text-xs text-gray-500">Created {podcast.createdDate}</p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
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
  )
}
