"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { viewNotesAPI } from "@/lib/api";
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
  Clock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  file_url?: string;
  upload_date: string;
  last_modified: string;
  download_count: number;
  is_processed_by_ai: boolean;
  upvote_count: number;
  downvote_count: number;
  is_upvoted_by_user: boolean;
  is_downvoted_by_user: boolean;
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
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);

  // Fetch note details from API
  useEffect(() => {
    const fetchNoteDetails = async () => {
      try {
        setIsLoading(true);

        // Fetch note details
        const noteResponse = await viewNotesAPI.getNoteDetails(noteId);
        if (noteResponse.success) {
          const fetchedNote = noteResponse.data;
          setNote(fetchedNote);
          setIsLiked(fetchedNote.is_liked_by_user);
          setLikeCount(fetchedNote.like_count);
          setUpvotes(fetchedNote.upvote_count);
          setDownvotes(fetchedNote.downvote_count);
          setIsUpvoted(fetchedNote.is_upvoted_by_user);
          setIsDownvoted(fetchedNote.is_downvoted_by_user);
        }

        // Fetch comments
        const commentsResponse = await viewNotesAPI.getNoteComments(noteId);
        if (commentsResponse.success) {
          setComments(commentsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching note details:", error);
        toast({
          title: "Error",
          description: "Failed to load note details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoteDetails();
  }, [noteId]);

  const handleLike = async () => {
    try {
      const response = await viewNotesAPI.toggleLike(noteId);
      if (response.success) {
        setIsLiked(response.data.isLiked);
        setLikeCount(response.data.likeCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleUpvote = async () => {
    try {
      const response = await viewNotesAPI.toggleVote(noteId, "upvote");
      if (response.success) {
        setUpvotes(response.data.upvotes);
        setDownvotes(response.data.downvotes);
        setIsUpvoted(response.data.userVote === "upvote");
        setIsDownvoted(response.data.userVote === "downvote");
      }
    } catch (error) {
      console.error("Error toggling upvote:", error);
    }
  };

  const handleDownvote = async () => {
    try {
      const response = await viewNotesAPI.toggleVote(noteId, "downvote");
      if (response.success) {
        setUpvotes(response.data.upvotes);
        setDownvotes(response.data.downvotes);
        setIsUpvoted(response.data.userVote === "upvote");
        setIsDownvoted(response.data.userVote === "downvote");
      }
    } catch (error) {
      console.error("Error toggling downvote:", error);
    }
  };

  const handleSummarize = () => {
    // Keep non-functional as requested
    toast({
      title: "Coming Soon!",
      description: "AI summarization feature will be available soon.",
    });
  };

  const handleDownload = async () => {
    try {
      // Use view-notes endpoint to match the backend route
      window.open(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        }/notes/${noteId}/download`,
        "_blank"
      );
    } catch (error) {
      console.error("Error downloading note:", error);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share && note) {
      navigator.share({
        title: note.title,
        text: note.description,
        url: note?.file_url || window.location.href,
      });
    } else {
      navigator.clipboard.writeText(note?.file_url || window.location.href);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    }
  };

  const handlePostComment = async () => {
    if (newComment.trim() && note) {
      try {
        const response = await viewNotesAPI.addComment(noteId, {
          comment_text: newComment.trim(),
        });
        if (response.success) {
          // Refresh comments
          const commentsResponse = await viewNotesAPI.getNoteComments(noteId);
          if (commentsResponse.success) {
            setComments(commentsResponse.data);
          }
          setNewComment("");
          toast({
            title: "Success",
            description: "Comment posted successfully!",
          });
        }
      } catch (error) {
        console.error("Error posting comment:", error);
        toast({
          title: "Error",
          description: "Failed to post comment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Note not found
          </h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Button>
        <div>
          {/* Note Header */}
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Title and Course Badge */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    {note.courses && (
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                        {note.courses.course_code}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-white">
                      {note.file_type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      {formatFileSize(note.file_size_bytes)}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {note.title}
                  </h1>
                  {note.description && (
                    <p className="text-lg text-gray-600">{note.description}</p>
                  )}
                </div>

                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={note.users.profile_picture_url}
                        alt={note.users.name}
                      />
                      <AvatarFallback className="bg-blue-200 text-blue-700">
                        {note.users.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">
                          {note.users.name}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500">
                          {note.users.department}
                        </span>
                        {note.users.semester && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">
                              Semester {note.users.semester}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Uploaded {formatRelativeTime(note.upload_date)}
                          </span>
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
                      className={
                        isLiked
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      }
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${
                          isLiked ? "fill-current" : ""
                        }`}
                      />
                      {likeCount}
                    </Button>
                    <Button
                      variant={isUpvoted ? "default" : "outline"}
                      size="sm"
                      onClick={handleUpvote}
                      className={
                        isUpvoted
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                      }
                    >
                      <ArrowUp
                        className={`w-4 h-4 mr-2 ${
                          isUpvoted ? "fill-current" : ""
                        }`}
                      />
                      {upvotes}
                    </Button>
                    <Button
                      variant={isDownvoted ? "default" : "outline"}
                      size="sm"
                      onClick={handleDownvote}
                      className={
                        isDownvoted
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                          : "hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300"
                      }
                    >
                      <ArrowDown
                        className={`w-4 h-4 mr-2 ${
                          isDownvoted ? "fill-current" : ""
                        }`}
                      />
                      {downvotes}
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
              </div>
            </CardContent>
          </Card>

          {/* Document Preview */}
          <div className="space-y-8 flex flex-row justify-between gap-8 ">
            <Card className="mb-8 w-2/3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {note.file_url ? (
                  // <PDFViewer
                  //   fileUrl={note.file_url}
                  //   fileName={note.file_name}
                  //   onDownloadClick={handleDownload}
                  // />
                  <iframe
                    src={note.file_url} // from Supabase
                    width="100%"
                    height="800px"
                  />
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Preview not available
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {note.file_type === "pdf"
                        ? "Unable to load PDF preview. Please download the file to view the content."
                        : "Document preview is only available for PDF files. Download the file to view the content."}
                    </p>
                    <Button
                      onClick={handleDownload}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download {note.file_name}
                    </Button>
                  </div>
                )}
                {/* AI summary button */}
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                        AI Summary
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Get a concise summary of these notes powered by AI
                      </p>
                    </div>
                    <Button
                      onClick={handleSummarize}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Summarize</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="mb-8 w-1/3">
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
                      <p className="text-gray-500">
                        No comments yet. Be the first to comment!
                      </p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start space-x-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={comment.users.profile_picture_url}
                            alt={comment.users.name}
                          />
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                            {comment.users.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-gray-900 text-sm">
                                {comment.users.name}
                              </span>
                              <span className="text-gray-500 text-xs">•</span>
                              <span className="text-gray-500 text-xs">
                                {comment.users.department}
                              </span>
                              <span className="text-gray-500 text-xs">•</span>
                              <span className="text-gray-500 text-xs flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatRelativeTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">
                              {comment.comment_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
