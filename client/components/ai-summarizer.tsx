"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Cloud, Upload, FileText, X } from "lucide-react"

export default function AISummarizer() {
  const [customInstructions, setCustomInstructions] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Check if file type is supported
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.pptx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (supportedTypes.includes(file.type) || supportedExtensions.includes(fileExtension)) {
      setSelectedFile(file)
    } else {
      alert('Please select a supported file format: PDF, DOCX, TXT, DOC, or PPTX')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleGenerateSummary = () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }
    
    // Here you would typically send the file to your backend
    // For now, we'll just show a placeholder message
    alert(`Generating summary for: ${selectedFile.name}\nInstructions: ${customInstructions || 'Default summary'}`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
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
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center bg-white transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-blue-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt,.pptx"
                className="hidden"
              />
              
              {!selectedFile ? (
                <>
                  <Cloud className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-700 mb-2">Drag and drop your file here</p>
                  <p className="text-gray-500 mb-4">or click to browse</p>
                  <Button variant="outline" className="bg-white" onClick={handleChooseFile}>
                    Choose File
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-green-500 mx-auto" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">{selectedFile.name}</p>
                    <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={handleChooseFile}>
                      <Upload className="w-4 h-4 mr-1" />
                      Replace
                    </Button>
                    <Button variant="outline" size="sm" onClick={removeFile}>
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Supported Formats */}
            <p className="text-sm text-gray-500 text-center">
              Supported formats: PDF
            </p>

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
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleGenerateSummary}
              disabled={!selectedFile}
            >
              Generate AI Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
