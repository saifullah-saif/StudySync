"use client"

import { useState } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Search, Filter, Grid3X3, List, Heart, User, Calendar, Upload, Cloud } from "lucide-react"

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadCourse, setUploadCourse] = useState("")
  const [visibility, setVisibility] = useState("public")
  const [customInstructions, setCustomInstructions] = useState("")

  const notes = [
    {
      id: 1,
      title: "Introduction to Data Structures",
      course: "CSE 220",
      fileType: "PDF",
      likes: 42,
      author: "Medha",
      uploadDate: "Jan 15",
      description: "Comprehensive notes covering arrays, linked lists, stacks, and queues with examples.",
    },
    {
      id: 2,
      title: "Database Normalization Concepts",
      course: "CSE 370",
      fileType: "DOCX",
      likes: 28,
      author: "Sarah",
      uploadDate: "Jan 12",
      description: "Detailed explanation of 1NF, 2NF, 3NF with practical examples and exercises.",
    },
    {
      id: 3,
      title: "Machine Learning Algorithms",
      course: "CSE 425",
      fileType: "PDF",
      likes: 56,
      author: "Alex",
      uploadDate: "Jan 10",
      description: "Overview of supervised and unsupervised learning algorithms with implementation notes.",
    },
  ]

  const courses = ["CSE 220", "CSE 370", "CSE 425", "MAT 120", "PHY 101"]

  const filteredNotes = notes.filter(
    (note) =>
      (selectedCourse === "all" || note.course === selectedCourse) &&
      (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mx-auto">
            <TabsTrigger value="browse">Browse Notes</TabsTrigger>
            <TabsTrigger value="upload">Upload Your Notes</TabsTrigger>
            <TabsTrigger value="ai-summarizer">AI Summarizer</TabsTrigger>
          </TabsList>

          {/* Browse Notes Tab */}
          <TabsContent value="browse" className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Notes</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover and learn from notes shared by your fellow students.
              </p>
            </div>

            {/* Search and Filter Bar */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by title, course, or keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className={viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="w-48 bg-white">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Count */}
            <div className="text-left">
              <p className="text-gray-600">{filteredNotes.length} Notes Found</p>
            </div>

            {/* Notes Grid */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {filteredNotes.map((note) => (
                <Card key={note.id} className="bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">{note.title}</h3>
                      <div className="flex items-center space-x-1 text-red-500 ml-2">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">{note.likes}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {note.course}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {note.fileType}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{note.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{note.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{note.uploadDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Upload Your Notes Tab */}
          <TabsContent value="upload" className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Notes</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Share your lecture notes with fellow students and help them succeed.
              </p>
            </div>

            {/* Upload Module */}
            <Card className="bg-blue-50 border-blue-200 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* File Input */}
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-white">
                    <Cloud className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">Drag and drop your file here</p>
                    <p className="text-gray-500 mb-4">or click to browse</p>
                    <Button variant="outline" className="bg-white">
                      Choose File
                    </Button>
                  </div>

                  {/* Supported Formats */}
                  <p className="text-sm text-gray-500 text-center">Supported formats: PDF, DOCX, TXT (Max 50MB)</p>

                  {/* Title Field */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Add a notes title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  {/* Course Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select value={uploadCourse} onValueChange={setUploadCourse}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Visibility Options */}
                  <div className="space-y-3">
                    <Label>Visibility</Label>
                    <RadioGroup value={visibility} onValueChange={setVisibility}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">Public - Anyone can view</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private - Only you can view</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Submit Button */}
                  <Button className="w-full bg-gray-400 hover:bg-gray-500 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Summarizer Tab */}
          <TabsContent value="ai-summarizer" className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Summarizer</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Upload any document and get an instant AI-powered summary to help you study more efficiently.
              </p>
            </div>

            {/* Summarizer Module */}
            <Card className="bg-blue-50 border-blue-200 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* File Input */}
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-white">
                    <Cloud className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">Drag and drop your file here</p>
                    <p className="text-gray-500 mb-4">or click to browse</p>
                    <Button variant="outline" className="bg-white">
                      Choose File
                    </Button>
                  </div>

                  {/* Supported Formats */}
                  <p className="text-sm text-gray-500 text-center">Supported formats: PDF, DOCX, TXT, DOC, PPTX</p>

                  {/* Custom Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      placeholder="e.g., 'Focus on key formulas and equations' or 'Summarize in bullet points' or 'Explain concepts in simple terms'"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="bg-white min-h-[100px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button className="w-full bg-gray-400 hover:bg-gray-500 text-white">Generate AI Summary</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
