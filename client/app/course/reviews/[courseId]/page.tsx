"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User, Calendar, BookOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLoadingFallback } from "@/components/page-loading-fallback";
import { reviewAPI, courseAPI } from "@/lib/api";

interface Review {
  id: number;
  difficulty_rating: number;
  workload_rating: number | null;
  review_text: string | null;
  semester_taken: string;
  year_taken: number;
  is_anonymous: boolean;
  up_votes: number;
  down_votes: number;
  created_at: string;
  users: {
    id: number;
    name: string;
    department: string;
    semester: number;
    profile_picture_url: string | null;
  } | null;
}

interface ReviewStats {
  total_reviews: number;
  average_difficulty: number;
  average_workload: number;
}

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
  credit_hours?: number;
  description?: string | null;
  difficulty?: string;
  course_type?: string;
  prerequisites?: string[];
}

interface ReviewsPageContentProps {
  params: {
    courseId: string;
  };
}

function ReviewsPageContent({ params }: ReviewsPageContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(true);

  const courseId = params.courseId;

  useEffect(() => {
    if (courseId && user) {
      const parsedCourseId = parseInt(courseId);
      if (!isNaN(parsedCourseId)) {
        fetchCourseAndReviews(parsedCourseId);
      } else {
        setIsLoading(false);
        setCourseLoading(false);
      }
    }
  }, [courseId, user]);

  const fetchCourseAndReviews = async (id: number) => {
    setIsLoading(true);
    setCourseLoading(true);

    try {
      // Fetch course details and reviews in parallel
      const [courseResponse, reviewsResponse] = await Promise.allSettled([
        courseAPI.getCourseById(id),
        reviewAPI.getCourseReviews(id),
      ]);

      // Handle course response
      if (
        courseResponse.status === "fulfilled" &&
        courseResponse.value.success
      ) {
        setCourse(courseResponse.value.data);
      } else {
        console.error(
          "Failed to fetch course details:",
          courseResponse.status === "rejected"
            ? courseResponse.reason
            : "Unknown error"
        );
      }

      // Handle reviews response
      if (
        reviewsResponse.status === "fulfilled" &&
        reviewsResponse.value.success
      ) {
        setReviews(reviewsResponse.value.data.reviews);
        setStats(reviewsResponse.value.data.stats);
      } else {
        // For 404 or empty reviews, set empty state
        if (
          reviewsResponse.status === "rejected" &&
          reviewsResponse.reason?.response?.status === 404
        ) {
          setReviews([]);
          setStats({
            total_reviews: 0,
            average_difficulty: 0,
            average_workload: 0,
          });
        } else {
          console.error(
            "Failed to fetch reviews:",
            reviewsResponse.status === "rejected"
              ? reviewsResponse.reason
              : "Unknown error"
          );
          toast({
            title: "Error",
            description: "Failed to load reviews",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCourseLoading(false);
    }
  };

  const StarDisplay = ({
    rating,
    showNumber = true,
  }: {
    rating: number;
    showNumber?: boolean;
  }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
      )}
    </div>
  );

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please sign in to view course reviews.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show loading while course data is being fetched
  if (courseLoading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading course details...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show error if course is not found
  if (!course) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The course you're looking for doesn't exist or has been removed.
              </p>
              <Button
                onClick={() => router.push("/course")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Course Catalog
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mr-4 pr-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/course")}
              className="mb-6 hover:bg-white/50 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
          <div className="flex flex-col items-center align-middle mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Course Reviews
            </h1>
            <p className="text-2xl font-bold text-slate-900">
              {course.course_code} - {course.course_name}
            </p>
            {course.department && (
              <p className="text-lg text-slate-600 mt-2">{course.department}</p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Section */}
              {stats && stats.total_reviews > 0 && (
                <Card className="bg-white border-0 shadow-lg">
                  <CardContent className="pt-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          {stats.total_reviews}
                        </div>
                        <div className="text-sm font-medium text-slate-600">
                          Total Reviews
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <StarDisplay
                            rating={Math.round(stats.average_difficulty)}
                            showNumber={false}
                          />
                          <span className="ml-2 text-3xl font-bold text-slate-900">
                            {stats.average_difficulty.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-600">
                          Average Difficulty
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <StarDisplay
                            rating={Math.round(stats.average_workload)}
                            showNumber={false}
                          />
                          <span className="ml-2 text-3xl font-bold text-slate-900">
                            {stats.average_workload.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-600">
                          Average Workload
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <Card className="bg-white border-0 shadow-lg">
                  <CardContent className="py-16 text-center">
                    <BookOpen className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      Sorry, no reviews yet
                    </h3>
                    <p className="text-lg text-slate-600">
                      Be the first to share your experience with this course!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 space-y-4">
                  {reviews.map((review) => (
                    <Card
                      key={review.id}
                      className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CardContent className="p-6 space-y-4">
                        {/* User Info */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            {!review.is_anonymous &&
                            review.users?.profile_picture_url ? (
                              <AvatarImage
                                src={review.users.profile_picture_url}
                                alt={review.users.name || "User"}
                              />
                            ) : null}
                            <AvatarFallback>
                              {review.is_anonymous ? (
                                <User className="h-5 w-5" />
                              ) : (
                                review.users?.name?.charAt(0) || "U"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">
                              {review.is_anonymous
                                ? "Anonymous"
                                : review.users?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-slate-600 flex items-center space-x-2">
                              {!review.is_anonymous && review.users && (
                                <>
                                  <span>{review.users.department}</span>
                                  <span>•</span>
                                  <span>Semester {review.users.semester}</span>
                                  <span>•</span>
                                </>
                              )}
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {review.semester_taken} {review.year_taken}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 font-medium"
                          >
                            {new Date(review.created_at).toLocaleDateString()}
                          </Badge>
                        </div>

                        {/* Ratings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-700">
                              Difficulty:
                            </span>
                            <StarDisplay rating={review.difficulty_rating} />
                          </div>
                          {review.workload_rating && (
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-700">
                                Workload:
                              </span>
                              <StarDisplay rating={review.workload_rating} />
                            </div>
                          )}
                        </div>

                        {/* Review Text */}
                        {review.review_text && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                            <p className="text-slate-700 leading-relaxed">
                              {review.review_text}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Main export with Suspense wrapper
export default function ReviewsPage({
  params,
}: {
  params: { courseId: string };
}) {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading course reviews..." />}
    >
      <ReviewsPageContent params={params} />
    </Suspense>
  );
}
