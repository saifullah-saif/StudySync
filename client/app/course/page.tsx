"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import ReviewModal from "@/components/review-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  BookOpen,
  Clock,
  Star,
  MessageSquarePlus,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseAPI } from "@/lib/api";

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
  credit_hours: number;
  description: string | null;
  difficulty: string;
  course_type: string;
  prerequisites: string[];
  created_at: string;
  _count: {
    course_reviews: number;
  };
}

export default function CoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Get unique departments for filter
  const departments = Array.from(
    new Set(courses.map((course) => course.department))
  );

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, departmentFilter, difficultyFilter]);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses();

      const data = await response.data;
      if (data.success) {
        setCourses(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.course_code
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          course.course_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          course.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (course) => course.department === departmentFilter
      );
    }

    // Filter by difficulty
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (course) => course.difficulty === difficultyFilter
      );
    }

    setFilteredCourses(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCourseTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "core":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "elective":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "optional":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleAddReview = (course: Course) => {
    setSelectedCourse(course);
    setIsReviewModalOpen(true);
  };

  const handleViewReviews = (course: Course) => {
    router.push(`/course/reviews/${course.id}`);
  };

  const handleReviewSubmitted = () => {
    toast({
      title: "Success",
      description: "Your review has been submitted successfully!",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to view course information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Course Catalog
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore available courses and read reviews from fellow students
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Badge
                        variant="outline"
                        className="mb-2 text-sm font-bold px-3 py-1 text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:border-blue-600 dark:bg-blue-900/20"
                      >
                        {course.course_code}
                      </Badge>
                      <CardTitle className="text-lg font-semibold leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.course_name}
                      </CardTitle>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={getDifficultyColor(course.difficulty)}
                      variant="secondary"
                    >
                      {course.difficulty}
                    </Badge>
                    <Badge
                      className={getCourseTypeColor(course.course_type)}
                      variant="secondary"
                    >
                      {course.course_type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Department:</span>{" "}
                      {course.department}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.credit_hours} credits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{course._count.course_reviews} reviews</span>
                      </div>
                    </div>

                    {course.prerequisites &&
                      course.prerequisites.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Prerequisites:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {course.prerequisites.map((prereq, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                              >
                                {prereq}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {course.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewReviews(course)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 hover:scale-105"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Reviews
                      </Button>
                      <Button
                        onClick={() => handleAddReview(course)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105"
                        size="sm"
                      >
                        <MessageSquarePlus className="h-4 w-4 mr-2" />
                        Add Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedCourse && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          course={selectedCourse}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}
