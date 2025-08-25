"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Grid3X3, List, Heart, User, Calendar, Download } from "lucide-react"
import { notesAPI } from "@/lib/api"

interface Note {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size_bytes: string;
  visibility: string;
  upload_date: string;
  download_count: number;
  like_count: number;
  users: {
    id: number;
    name: string;
    department: string;
  };
  courses: {
    id: number;
    course_code: string;
    course_name: string;
  };
}

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
}

export default function BrowseNotes() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [notes, setNotes] = useState<Note[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await notesAPI.getCourses()
        if (response.success) {
          setCourses(response.data)
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      }
    }

    fetchCourses()
  }, [])

  // Fetch notes when filters change
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true)
      setError("")
      
      try {
        const filters: any = {
          visibility: "public",
          limit: 20,
          offset: 0,
        }

        if (selectedCourse !== "all") {
          filters.course = selectedCourse
        }

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim()
        }

        const response = await notesAPI.getAllNotes(filters)
        
        if (response.success) {
          setNotes(response.data)
        } else {
          setError("Failed to fetch notes")
        }
      } catch (error: any) {
        console.error("Error fetching notes:", error)
        setError("Failed to fetch notes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [selectedCourse, searchQuery])

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const handleNoteClick = (noteId: number) => {
    router.push(`/view-notes/${noteId}`)
  }

  const handleDownload = async (noteId: number) => {
    try {
      // This would typically open a download link
      window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/notes/${noteId}/download`, '_blank')
    } catch (error) {
      console.error("Download error:", error)
    }
  }

  return (
    <div className="space-y-8">
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
                    <SelectItem key={course.id} value={course.course_code}>
                      {course.course_code} - {course.course_name}
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
        <p className="text-gray-600">
          {isLoading ? "Loading..." : `${notes.length} Notes Found`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-blue-50 border-blue-200 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded mb-3"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Notes Grid */
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {notes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No notes found matching your criteria.</p>
            </div>
          ) : (
            notes.map((note) => (
              <Card 
                key={note.id} 
                className="bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleNoteClick(note.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">{note.title}</h3>
                    <div className="flex items-center space-x-1 text-red-500 ml-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-medium">{note.like_count || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {note.courses.course_code}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {note.file_type.toUpperCase()}
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      {formatFileSize(note.file_size_bytes)}
                    </span>
                  </div>

                  {note.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{note.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{note.users.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(note.upload_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Download className="w-4 h-4" />
                      <span className="text-xs">{note.download_count || 0} downloads</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(note.id)
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
