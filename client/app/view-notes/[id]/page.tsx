"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Download, 
  Share, 
  User, 
  Calendar, 
  FileText, 
  MessageCircle,
  ArrowLeft,
  Eye,
  Clock
} from "lucide-react"

// TypeScript interfaces matching Prisma schema
interface NoteDetail {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size_bytes: string;
  visibility: string;
  tags: string[];
  upload_date: string;
  last_modified: string;
  download_count: number;
  is_processed_by_ai: boolean;
  users: {
    id: number;
    name: string;
    email: string;
    department: string;
    semester?: number;
    profile_picture_url?: string;
    bio?: string;
  };
  courses: {
    id: number;
    course_code: string;
    course_name: string;
    department: string;
    credit_hours: number;
  };
  like_count: number;
  is_liked_by_user: boolean;
}

interface Comment {
  id: number;
  user_id: number;
  note_id: number;
  parent_comment_id?: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  users: {
    id: number;
    name: string;
    department: string;
    profile_picture_url?: string;
  };
  replies?: Comment[];
}

export default function ViewNotePage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const [note, setNote] = useState<NoteDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // Mock data that matches the schema structure
  useEffect(() => {
    const fetchNoteDetails = async () => {
      setIsLoading(true)
      
      // Simulate API delay
      setTimeout(() => {
        const mockNote: NoteDetail = {
          id: parseInt(noteId),
          title: "Introduction to Data Structures",
          description: "Comprehensive notes covering arrays, linked lists, stacks, queues, and their practical applications in computer science.",
          file_name: "intro-to-data-structures.pdf",
          file_path: "/uploads/notes/intro-to-data-structures.pdf",
          file_type: "pdf",
          file_size_bytes: "2457600", // 2.4 MB
          visibility: "public",
          tags: ["data-structures", "algorithms", "computer-science", "fundamentals"],
          upload_date: "2024-01-15T08:00:00Z",
          last_modified: "2024-01-15T08:00:00Z",
          download_count: 42,
          is_processed_by_ai: true,
          users: {
            id: 1,
            name: "Alex Chen",
            email: "alex.chen@university.edu",
            department: "Computer Science",
            semester: 6,
            profile_picture_url: "/placeholder-user.jpg",
            bio: "Computer Science student passionate about algorithms and data structures"
          },
          courses: {
            id: 1,
            course_code: "CSE220",
            course_name: "Data Structures",
            department: "Computer Science",
            credit_hours: 3
          },
          like_count: 24,
          is_liked_by_user: false
        }

        const mockComments: Comment[] = [
          {
            id: 1,
            user_id: 2,
            note_id: parseInt(noteId),
            comment_text: "Really helpful notes! The examples made everything clear.",
            created_at: "2024-01-15T14:30:00Z",
            updated_at: "2024-01-15T14:30:00Z",
            users: {
              id: 2,
              name: "Sarah Johnson",
              department: "Computer Science",
              profile_picture_url: "/placeholder-user.jpg"
            }
          },
          {
            id: 2,
            user_id: 3,
            note_id: parseInt(noteId),
            comment_text: "Thanks for sharing. The section on time complexity was exactly what I needed.",
            created_at: "2024-01-16T10:15:00Z",
            updated_at: "2024-01-16T10:15:00Z",
            users: {
              id: 3,
              name: "Mike Rodriguez",
              department: "Computer Science"
            }
          },
          {
            id: 3,
            user_id: 4,
            note_id: parseInt(noteId),
            comment_text: "Great organization and easy to follow. Helped me prepare for the exam!",
            created_at: "2024-01-16T16:45:00Z",
            updated_at: "2024-01-16T16:45:00Z",
            users: {
              id: 4,
              name: "Emma Davis",
              department: "Computer Science"
            }
          }
        ]

        setNote(mockNote)
        setComments(mockComments)
        setIsLiked(mockNote.is_liked_by_user)
        setLikeCount(mockNote.like_count)
        setIsLoading(false)
      }, 800)
    }

    fetchNoteDetails()
  }, [noteId])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleDownload = () => {
    if (note) {
      // Simulate download
      window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/notes/${note.id}/download`, '_blank')
    }
  }

  const handleShare = () => {
    if (navigator.share && note) {
      navigator.share({
        title: note.title,
        text: note.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handlePostComment = () => {
    if (newComment.trim() && note) {
      const comment: Comment = {
        id: comments.length + 1,
        user_id: 999, // Current user mock ID
        note_id: note.id,
        comment_text: newComment.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          id: 999,
          name: "Current User",
          department: "Computer Science"
        }
      }
      setComments([...comments, comment])
      setNewComment("")
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-48 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Note not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Button>

        {/* Note Header */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Title and Course Badge */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                    {note.courses.course_code}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    {note.file_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    {formatFileSize(note.file_size_bytes)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
                {note.description && (
                  <p className="text-lg text-gray-600">{note.description}</p>
                )}
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={note.users.profile_picture_url} alt={note.users.name} />
                    <AvatarFallback className="bg-blue-200 text-blue-700">
                      {note.users.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{note.users.name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{note.users.department}</span>
                      {note.users.semester && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">Semester {note.users.semester}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Uploaded {formatRelativeTime(note.upload_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{note.download_count} downloads</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className={isLiked ? "bg-red-500 hover:bg-red-600 text-white" : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    {likeCount}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">Tags:</span>
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-200 text-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Preview Placeholder */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Document Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Preview not available</h3>
              <p className="text-gray-500 mb-4">
                Document preview feature coming soon. Download the file to view the content.
              </p>
              <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download {note.file_name}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-200 text-blue-700 text-sm">
                    CU
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Post Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.users.profile_picture_url} alt={comment.users.name} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                        {comment.users.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900 text-sm">{comment.users.name}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-500 text-xs">{comment.users.department}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-500 text-xs flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.comment_text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
