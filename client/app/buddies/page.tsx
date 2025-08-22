"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { buddyAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MessageCircle, UserPlus, Clock, CheckCircle, XCircle } from "lucide-react"

interface Buddy {
  id: number
  name: string
  email: string
  department: string
  semester: number
  profile_picture_url?: string
  sharedCourses: Array<{ code: string; name: string }>
  type: 'peer' | 'mentor'
}

export default function BuddiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [buddyType, setBuddyType] = useState("peers")
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Load buddies data on component mount and when type changes
  useEffect(() => {
    loadBuddies()
  }, [buddyType])

  // Load buddies data with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadBuddies()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const loadBuddies = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await buddyAPI.getBuddies(buddyType, searchQuery)

      if (response.success) {
        setBuddies(response.data.buddies)
      } else {
        setError("Failed to load buddies")
      }
    } catch (err) {
      console.error("Error loading buddies:", err)
      setError("Failed to load buddies. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // No need for frontend filtering as backend handles search
  const filteredBuddies = buddies

  const pendingInvitations = [
    {
      id: 1,
      name: "David Kim",
      course: "Database Systems",
      type: "study",
      timeSlot: "Tomorrow 3-5 PM",
      status: "pending",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Lisa Park",
      course: "Machine Learning",
      type: "tutoring",
      timeSlot: "Friday 1-3 PM",
      status: "pending",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const activeConnections = [
    {
      id: 1,
      name: "John Smith",
      course: "Advanced Algorithms",
      lastMessage: "Hey, ready for tomorrow's study session?",
      time: "2 hours ago",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Anna Lee",
      course: "Software Engineering",
      lastMessage: "Thanks for the help with the project!",
      time: "1 day ago",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const handleInvite = (buddyId: number) => {
    // TODO: Implement invite functionality
    // This could send an invite request to the buddy
  }

  const handleInvitationResponse = (invitationId: number, response: "accept" | "decline") => {
    // TODO: Implement invitation response functionality
    // This could accept or decline pending invitations
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Buddies</h1>
          <p className="text-gray-600">Connect with classmates for collaborative learning and peer tutoring</p>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or course starting with...."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* People You May Know */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">People You May Know</h2>
                <Select value={buddyType} onValueChange={setBuddyType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="peers">Peers</SelectItem>
                    <SelectItem value="mentors">Mentors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading {buddyType}...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-700">{error}</p>
                  <Button onClick={loadBuddies} className="mt-2" size="sm">
                    Try Again
                  </Button>
                </div>
              ) : filteredBuddies.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {searchQuery ? (
                      `No ${buddyType} found matching "${searchQuery}"`
                    ) : (
                      buddyType === 'mentors' 
                        ? "No mentors found for your current courses" 
                        : "No peers found with shared courses"
                    )}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery ? (
                      "Try a different search term or clear the search"
                    ) : (
                      "Try changing your preferences or add more courses to your profile"
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBuddies.map((buddy) => (
                    <Card key={buddy.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={buddy.profile_picture_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {buddy.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{buddy.name}</CardTitle>
                            <CardDescription>
                              {buddy.department} • Semester {buddy.semester}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {buddyType === 'mentors' ? 'Can help with:' : 'Shared Courses:'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {buddy.sharedCourses.map((course, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-blue-200 text-gray-900">
                                {course.code}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleInvite(buddy.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {buddyType === 'mentors' ? 'Request Mentoring' : 'Send Study Invite'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={invitation.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {invitation.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{invitation.name}</h3>
                            <p className="text-sm text-gray-600">
                              {invitation.type === "study" ? "Study session" : "Tutoring session"} for{" "}
                              {invitation.course}
                            </p>
                            <p className="text-sm text-gray-500">{invitation.timeSlot}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleInvitationResponse(invitation.id, "accept")}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleInvitationResponse(invitation.id, "decline")}
                            size="sm"
                            variant="outline"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Connections</h2>
              <div className="space-y-4">
                {activeConnections.map((connection) => (
                  <Card key={connection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {connection.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{connection.name}</h3>
                            <p className="text-sm text-gray-600">{connection.course}</p>
                            <p className="text-sm text-gray-500 mt-1">{connection.lastMessage}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-2">{connection.time}</p>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
