"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star, ThumbsUp, ThumbsDown, User, Calendar, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Review {
  id: number
  difficulty_rating: number
  workload_rating: number | null
  review_text: string | null
  semester_taken: string
  year_taken: number
  is_anonymous: boolean
  up_votes: number
  down_votes: number
  created_at: string
  users: {
    id: number
    name: string
    department: string
    semester: number
  } | null
}

interface ReviewStats {
  total_reviews: number
  average_difficulty: number
  average_workload: number
}

interface ReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  course: {
    id: number
    course_code: string
    course_name: string
  }
}

export default function ReviewsModal({ isOpen, onClose, course }: ReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && course.id) {
      fetchReviews()
    }
  }, [isOpen, course.id])

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const { reviewAPI } = await import("@/lib/api")
      const response = await reviewAPI.getCourseReviews(course.id)
      
      if (response.success) {
        setReviews(response.data.reviews)
        setStats(response.data.stats)
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (reviewId: number, voteType: 'up' | 'down') => {
    try {
      const { reviewAPI } = await import("@/lib/api")
      await reviewAPI.updateReviewVotes(reviewId, voteType)
      
      // Update the local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? {
              ...review,
              up_votes: voteType === 'up' ? review.up_votes + 1 : review.up_votes,
              down_votes: voteType === 'down' ? review.down_votes + 1 : review.down_votes
            }
          : review
      ))

      toast({
        title: "Vote submitted",
        description: `Your ${voteType}vote has been recorded`,
      })
    } catch (error: any) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      })
    }
  }

  const StarDisplay = ({ rating, showNumber = true }: { rating: number, showNumber?: boolean }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      {showNumber && <span className="ml-1 text-sm text-gray-600">{rating}/5</span>}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Course Reviews</DialogTitle>
          <DialogDescription>
            Reviews for {course.course_code} - {course.course_name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Section */}
            {stats && stats.total_reviews > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Review Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.total_reviews}</div>
                    <div className="text-sm text-gray-600">Total Reviews</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center">
                      <StarDisplay rating={Math.round(stats.average_difficulty)} showNumber={false} />
                      <span className="ml-1 text-lg font-semibold">{stats.average_difficulty}</span>
                    </div>
                    <div className="text-sm text-gray-600">Avg. Difficulty</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center">
                      <StarDisplay rating={Math.round(stats.average_workload)} showNumber={false} />
                      <span className="ml-1 text-lg font-semibold">{stats.average_workload}</span>
                    </div>
                    <div className="text-sm text-gray-600">Avg. Workload</div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <ScrollArea className="h-[400px]">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No reviews yet for this course.</p>
                  <p className="text-sm text-gray-500">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      {/* User Info */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {review.is_anonymous ? (
                              <User className="h-4 w-4" />
                            ) : (
                              review.users?.name?.charAt(0) || "U"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {review.is_anonymous ? "Anonymous" : review.users?.name || "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2">
                            {!review.is_anonymous && review.users && (
                              <>
                                <span>{review.users.department}</span>
                                <span>•</span>
                                <span>Semester {review.users.semester}</span>
                                <span>•</span>
                              </>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {review.semester_taken} {review.year_taken}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(review.created_at).toLocaleDateString()}
                        </Badge>
                      </div>

                      {/* Ratings */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Difficulty:</span>
                          <StarDisplay rating={review.difficulty_rating} />
                        </div>
                        {review.workload_rating && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Workload:</span>
                            <StarDisplay rating={review.workload_rating} />
                          </div>
                        )}
                      </div>

                      {/* Review Text */}
                      {review.review_text && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {review.review_text}
                        </p>
                      )}

                      {/* Vote Buttons */}
                      <div className="flex items-center space-x-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(review.id, 'up')}
                          className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.up_votes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(review.id, 'down')}
                          className="flex items-center space-x-1 text-gray-600 hover:text-red-600"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>{review.down_votes}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
