"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import { profileAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Plus, X, Star, Camera, Upload } from "lucide-react"

interface Course {
  id: number
  course_code: string
  course_name: string
  department: string
  credit_hours: number
  description: string
  difficulty: string
  course_type: string
}

export default function ProfilePage() {
  const params = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    semester: "",
    department: "",
    bio: "",
    profile_picture_url: "",
    courses: [] as string[],
    previousCourses: [] as string[],
    completedCourses: [] as Array<{ name: string; rating: number; review: string }>,
  })

  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedPreviousCourse, setSelectedPreviousCourse] = useState("")
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)

  // Load profile data and available courses on component mount
  useEffect(() => {
    loadProfile()
    loadAvailableCourses()
    
    // Check if edit mode should be enabled from URL parameter
    if (params.edit === 'true') {
      setIsEditing(true)
    }
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await profileAPI.getProfile()

      if (response.success) {
        const profileData = response.data.profile
        setProfile({
          name: profileData.name || "",
          email: profileData.email || "",
          semester: profileData.semester?.toString() || "",
          department: profileData.department || "",
          bio: profileData.bio || "",
          profile_picture_url: profileData.profile_picture_url || "",
          courses: profileData.courses || [],
          previousCourses: profileData.previousCourses || [],
          completedCourses: profileData.completedCourses || [],
        })
      } else {
        setError("Failed to load profile")
      }
    } catch (err) {
      console.error("Error loading profile:", err)
      setError("Failed to load profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name, file.size, file.type);
      setProfilePictureFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false)
    setProfilePictureFile(null)
    setProfilePicturePreview(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")

      // Create FormData for profile update
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('email', profile.email);
      formData.append('semester', profile.semester);
      formData.append('department', profile.department);
      formData.append('bio', profile.bio);
      formData.append('courses', JSON.stringify(profile.courses));
      formData.append('previousCourses', JSON.stringify(profile.previousCourses));
      formData.append('completedCourses', JSON.stringify(profile.completedCourses));
      
      // Add profile picture if selected
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
      }

      const response = await profileAPI.updateProfile(formData)
      console.log('Profile update response:', response)

      if (response.success) {
        // Update local state with the response data
        const updatedProfile = response.data.profile
        setProfile({
          name: updatedProfile.name || "",
          email: updatedProfile.email || "",
          semester: updatedProfile.semester?.toString() || "",
          department: updatedProfile.department || "",
          bio: updatedProfile.bio || "",
          profile_picture_url: updatedProfile.profile_picture_url || profile.profile_picture_url,
          courses: updatedProfile.courses || [],
          previousCourses: updatedProfile.previousCourses || [],
          completedCourses: updatedProfile.completedCourses || [],
        })
        
        // Clear temporary file state after successful upload
        setProfilePictureFile(null)
        setProfilePicturePreview(null)
        setIsEditing(false)
      } else {
        setError("Failed to update profile")
      }
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const loadAvailableCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await profileAPI.getAllCourses()

      if (response.success) {
        setAvailableCourses(response.data.courses)
      } else {
        console.error("Failed to load courses:", response)
      }
    } catch (err) {
      console.error("Error loading courses:", err)
    } finally {
      setLoadingCourses(false)
    }
  }

  const addCourse = () => {
    if (selectedCourse.trim()) {
      // Check if course is already added
      if (!profile.courses.includes(selectedCourse)) {
        setProfile((prev) => ({
          ...prev,
          courses: [...prev.courses, selectedCourse],
        }))
      }
      setSelectedCourse("")
    }
  }

  const removeCourse = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
    }))
  }

  const addPreviousCourse = () => {
    if (selectedPreviousCourse.trim()) {
      // Check if course is already added
      if (!profile.previousCourses.includes(selectedPreviousCourse)) {
        setProfile((prev) => ({
          ...prev,
          previousCourses: [...prev.previousCourses, selectedPreviousCourse],
        }))
      }
      setSelectedPreviousCourse("")
    }
  }

  const removePreviousCourse = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      previousCourses: prev.previousCourses.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadProfile}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white">
                    <AvatarImage src={profilePicturePreview || profile.profile_picture_url || "/placeholder.svg?height=96&width=96"} />
                    <AvatarFallback className="text-2xl font-bold bg-blue-200 text-blue-800">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="text-blue-100 text-lg">
                    {profile.department} • Semester {profile.semester}
                  </p>
                  <p className="text-blue-100">{profile.email}</p>
                </div>
              </div>
              <Button
                onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-gray-700">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Profile Picture Management - Only show when editing */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload or change your profile picture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {(profilePicturePreview || profile.profile_picture_url) && (
                      <div className="relative">
                        <img
                          src={profilePicturePreview || profile.profile_picture_url}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                        <button
                          onClick={handleRemoveProfilePicture}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                          title="Remove picture"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="profile-picture-upload"
                      />
                      <label
                        htmlFor="profile-picture-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Choose Image
                      </label>
                      <p className="mt-2 text-sm text-gray-500">
                        Upload a JPG, PNG, or GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Current Courses</CardTitle>
                <CardDescription>Courses you're currently enrolled in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.courses.map((course, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3 border-gray-200 text-gray-900">
                      {course}
                      {isEditing && (
                        <button onClick={() => removeCourse(index)} className="ml-2 text-gray-500 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                      disabled={loadingCourses}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course to add..."} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {availableCourses
                          .filter(course => {
                            const isNotEnrolled = !profile.courses.includes(course.course_code) && 
                                                  !profile.previousCourses.includes(course.course_code);
                            return isNotEnrolled;
                          })
                          .map((course) => (
                            <SelectItem key={course.id} value={course.course_code}>
                              <div className="flex flex-col">
                                <span className="font-medium">{course.course_code}</span>
                                <span className="text-sm text-gray-500">{course.course_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        {availableCourses.length === 0 && (
                          <div className="p-2 text-sm text-gray-500">No courses available</div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={addCourse} size="sm" disabled={!selectedCourse || loadingCourses}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Previous Courses</CardTitle>
                <CardDescription>Courses you have completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.previousCourses.map((course, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3 border-gray-200 text-gray-900">
                      {course}
                      {isEditing && (
                        <button onClick={() => removePreviousCourse(index)} className="ml-2 text-gray-500 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Select
                      value={selectedPreviousCourse}
                      onValueChange={setSelectedPreviousCourse}
                      disabled={loadingCourses}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a completed course to add..."} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {availableCourses
                          .filter(course => {
                            const isNotEnrolled = !profile.courses.includes(course.course_code) && 
                                                  !profile.previousCourses.includes(course.course_code);
                            return isNotEnrolled;
                          })
                          .map((course) => (
                            <SelectItem key={course.id} value={course.course_code}>
                              <div className="flex flex-col">
                                <span className="font-medium">{course.course_code}</span>
                                <span className="text-sm text-gray-500">{course.course_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        {availableCourses.length === 0 && (
                          <div className="p-2 text-sm text-gray-500">No courses available</div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={addPreviousCourse} size="sm" disabled={!selectedPreviousCourse || loadingCourses}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Course Reviews</CardTitle>
                <CardDescription>Your reviews of completed courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.completedCourses.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{course.name}</h4>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < course.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{course.review}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={profile.semester}
                        onValueChange={(value) => setProfile((prev) => ({ ...prev, semester: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              {sem}
                              {sem === 1 ? "st" : sem === 2 ? "nd" : sem === 3 ? "rd" : "th"} Semester
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={profile.department}
                        onValueChange={(value) => setProfile((prev) => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                          <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
