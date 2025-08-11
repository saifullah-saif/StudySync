"use client"

import { useState } from "react"
import Header from "@/components/header"
import UploadNotes from "@/components/upload-notes"
import BrowseNotes from "@/components/browse-notes"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Cloud } from "lucide-react"

export default function NotesPage() {
  const [customInstructions, setCustomInstructions] = useState("")

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
            <BrowseNotes />
          </TabsContent>

          {/* Upload Your Notes Tab */}
          <TabsContent value="upload" className="space-y-8">
            <UploadNotes />
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
