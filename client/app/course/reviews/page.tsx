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
import { SafeSearchParamsHandler } from "@/components/safe-search-params-handler";
import { PageLoadingFallback } from "@/components/page-loading-fallback";
import { reviewAPI } from "@/lib/api";
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
}

function ReviewsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParamsLoaded, setSearchParamsLoaded] = useState(false);
  const [searchParamsData, setSearchParamsData] = useState<{
    courseId: string | null;
    courseName: string | null;
    courseCode: string | null;
  }>({
    courseId: null,
    courseName: null,
    courseCode: null,
  });

  const courseId = searchParamsData.courseId;
  const courseName = searchParamsData.courseName;
  const courseCode = searchParamsData.courseCode;

  // Handle search params updates
  const handleSearchParamsChange = (params: URLSearchParams) => {
    try {
      const newSearchParamsData = {
        courseId: params.get("courseId"),
        courseName: params.get("courseName"),
        courseCode: params.get("courseCode"),
      };

      setSearchParamsData(newSearchParamsData);
      setSearchParamsLoaded(true);

      // Set course immediately if we have valid parameters
      if (
        newSearchParamsData.courseId &&
        newSearchParamsData.courseName &&
        newSearchParamsData.courseCode
      ) {
        const parsedCourseId = parseInt(newSearchParamsData.courseId);
        if (!isNaN(parsedCourseId)) {
          try {
            const decodedCourseName = decodeURIComponent(
              newSearchParamsData.courseName
            );
            const decodedCourseCode = decodeURIComponent(
              newSearchParamsData.courseCode
            );

            setCourse({
              id: parsedCourseId,
              course_code: decodedCourseCode,
              course_name: decodedCourseName,
              department: "",
            });
          } catch (decodeError) {
            console.error("Error decoding course parameters:", decodeError);
            // Fallback to non-decoded values
            setCourse({
              id: parsedCourseId,
              course_code: newSearchParamsData.courseCode,
              course_name: newSearchParamsData.courseName,
              department: "",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing search parameters:", error);
      setSearchParamsLoaded(true);
    }
  };

  useEffect(() => {
    // Only proceed with fetching reviews if we have valid course data
    if (searchParamsLoaded && courseId && courseName && courseCode) {
      const parsedCourseId = parseInt(courseId);
      if (!isNaN(parsedCourseId)) {
        fetchReviews(parsedCourseId);
      } else {
        setIsLoading(false);
      }
    } else if (searchParamsLoaded) {
      // Search params are loaded but invalid - stop loading
      setIsLoading(false);
    }
  }, [searchParamsLoaded, courseId, courseName, courseCode]);

  const fetchReviews = async (targetCourseId?: string | number) => {
    const idToUse = targetCourseId || courseId;
    if (!idToUse) return;

    setIsLoading(true);
    try {
      const response = await reviewAPI.getCourseReviews(idToUse);

      if (response.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      // Don't show error toast for empty reviews (404 is expected for courses with no reviews)
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load reviews",
          variant: "destructive",
        });
      } else {
        // For 404, still set empty reviews to show "no reviews" message
        setReviews([]);
        setStats({
          total_reviews: 0,
          average_difficulty: 0,
          average_workload: 0,
        });
      }
    } finally {
      setIsLoading(false);
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

  // Show loading while search params are being processed
  if (!searchParamsLoaded) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  // Show error if course parameters are invalid or missing
  if (!course || !courseId || !courseName || !courseCode) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Invalid course information provided. Please access this page
                through the course catalog.
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
      {/* Handle search params safely */}
      <SafeSearchParamsHandler onParamsChange={handleSearchParamsChange} />

      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 hover:bg-white/50 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>

            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Course Reviews
            </h1>
            <p className="text-xl text-slate-600">
              {course.course_code} - {course.course_name}
            </p>
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
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      Review Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                <div className="space-y-4">
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
                        <div className="flex items-center space-x-8">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Difficulty:</span>
                            <StarDisplay rating={review.difficulty_rating} />
                          </div>
                          {review.workload_rating && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Workload:</span>
                              <StarDisplay rating={review.workload_rating} />
                            </div>
                          )}
                        </div>

                        {/* Review Text */}
                        {review.review_text && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
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
export default function ReviewsPage() {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading course reviews..." />}
    >
      <ReviewsPageContent />
    </Suspense>
  );
}
