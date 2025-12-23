"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, GraduationCap, Building2, BookOpen } from "lucide-react"

interface Buddy {
  id: number
  name: string
  email: string
  department: string
  semester: number
  profile_picture_url?: string
  bio?: string
  sharedCourses: Array<{ code: string; name: string }>
  currentCourses?: Array<{ code: string; name: string }>
  previousCourses?: Array<{ code: string; name: string }>
  type: 'peer' | 'mentor'
  connection_status?: 'pending' | 'accepted' | 'rejected' | null
  connection_type?: 'peer' | 'mentor' | null
  is_requester?: boolean
  is_connected?: boolean
  has_pending_request?: boolean
}

interface BuddyProfileModalProps {
  buddy: Buddy | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuddyProfileModal({ buddy, open, onOpenChange }: BuddyProfileModalProps) {
  if (!buddy) return null

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Profile Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture and Name */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={buddy.profile_picture_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{getInitials(buddy.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-semibold">{buddy.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {buddy.type === 'mentor' ? 'Mentor' : 'Peer'}
              </Badge>
            </div>
          </div>

          {/* Bio Section */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Bio</h4>
            </div>
            <p className="text-gray-600 text-sm ml-7">
              {buddy.bio || "No bio available"}
            </p>
          </div>

          {/* Academic Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Department</h4>
              </div>
              <p className="text-gray-700 ml-7">{buddy.department}</p>
            </div>

            {/* Semester */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Semester</h4>
              </div>
              <p className="text-gray-700 ml-7">{buddy.semester}</p>
            </div>
          </div>

          {/* Current Courses */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Current Courses</h4>
            </div>
            {buddy.currentCourses && buddy.currentCourses.length > 0 ? (
              <div className="ml-7 space-y-2">
                {buddy.currentCourses.map((course, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {course.code}
                    </Badge>
                    <span className="text-sm text-gray-700">{course.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm ml-7">No current courses available</p>
            )}
          </div>

          {/* Previous Courses */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Previous Courses</h4>
            </div>
            {buddy.previousCourses && buddy.previousCourses.length > 0 ? (
              <div className="ml-7 space-y-2">
                {buddy.previousCourses.map((course, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {course.code}
                    </Badge>
                    <span className="text-sm text-gray-700">{course.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm ml-7">
                No previous courses available
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
