"use client"

import { useState } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Plus, X, Star } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@university.edu",
    semester: "6",
    department: "Computer Science",
    bio: "Passionate about machine learning and software development. Always looking for study partners for advanced algorithms and data structures.",
    courses: ["Advanced Algorithms", "Machine Learning", "Database Systems", "Software Engineering"],
    completedCourses: [
      { name: "Data Structures", rating: 5, review: "Excellent course with practical applications" },
      { name: "Web Development", rating: 4, review: "Great introduction to modern web technologies" },
    ],
  })

  const [newCourse, setNewCourse] = useState("")

  const handleSave = () => {
    setIsEditing(false)
    // Save profile logic here
  }

  const addCourse = () => {
    if (newCourse.trim()) {
      setProfile((prev) => ({
        ...prev,
        courses: [...prev.courses, newCourse.trim()],
      }))
      setNewCourse("")
    }
  }

  const removeCourse = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24 border-4 border-white">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                  <AvatarFallback className="text-2xl font-bold bg-blue-200 text-blue-800">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="text-blue-100 text-lg">
                    {profile.department} • Semester {profile.semester}
                  </p>
                  <p className="text-blue-100">{profile.email}</p>
                </div>
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
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

            {/* Current Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Current Courses</CardTitle>
                <CardDescription>Courses you're currently enrolled in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.courses.map((course, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
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
                    <Input
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      placeholder="Add a course..."
                      onKeyPress={(e) => e.key === "Enter" && addCourse()}
                    />
                    <Button onClick={addCourse} size="sm">
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
                        <SelectContent>
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
                        <SelectContent>
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
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
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
