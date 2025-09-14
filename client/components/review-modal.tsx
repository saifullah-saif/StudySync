"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    course_code: string;
    course_name: string;
  };
  onReviewSubmitted: () => void;
}

const SEMESTERS = ["Fall", "Spring", "Summer"];

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018];

export default function ReviewModal({
  isOpen,
  onClose,
  course,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    difficulty_rating: 0,
    workload_rating: 0,
    review_text: "",
    semester_taken: "",
    year_taken: "",
    is_anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.difficulty_rating ||
      !formData.semester_taken ||
      !formData.year_taken
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { reviewAPI } = await import("@/lib/api");

      await reviewAPI.createReview({
        course_id: course.id,
        difficulty_rating: formData.difficulty_rating,
        workload_rating: formData.workload_rating || null,
        review_text: formData.review_text || null,
        semester_taken: formData.semester_taken,
        year_taken: parseInt(formData.year_taken),
        is_anonymous: formData.is_anonymous,
      });

      // Reset form
      setFormData({
        difficulty_rating: 0,
        workload_rating: 0,
        review_text: "",
        semester_taken: "",
        year_taken: "",
        is_anonymous: false,
      });

      onReviewSubmitted();
      onClose();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    setRating,
    label,
  }: {
    rating: number;
    setRating: (rating: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label} *</Label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              } transition-colors hover:fill-yellow-300 hover:text-yellow-300`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
          <DialogDescription>
            Share your experience with {course.course_code} -{" "}
            {course.course_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <StarRating
                rating={formData.difficulty_rating}
                setRating={(rating) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficulty_rating: rating,
                  }))
                }
                label="Difficulty"
              />
            </div>
            <div>
              <StarRating
                rating={formData.workload_rating}
                setRating={(rating) =>
                  setFormData((prev) => ({ ...prev, workload_rating: rating }))
                }
                label="Workload (Optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="semester" className="text-sm font-medium">
                Semester Taken *
              </Label>
              <Select
                value={formData.semester_taken}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, semester_taken: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {SEMESTERS.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year" className="text-sm font-medium">
                Year Taken *
              </Label>
              <Select
                value={formData.year_taken}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, year_taken: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="review" className="text-sm font-medium">
              Review (Optional)
            </Label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about this course..."
              value={formData.review_text}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  review_text: e.target.value,
                }))
              }
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Switch
              id="anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_anonymous: checked }))
              }
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 border border-gray-400"
            />
            <Label
              htmlFor="anonymous"
              className="text-sm font-medium cursor-pointer"
            >
              Submit anonymously
            </Label>
            {formData.is_anonymous && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                ✓ Anonymous
              </span>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
