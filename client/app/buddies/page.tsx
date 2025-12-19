"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { buddyAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MessageCircle, UserPlus, Clock, CheckCircle, XCircle, UserCheck } from "lucide-react"
import { BuddyProfileModal } from "./components/buddy-profile-modal"

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

interface Invitation {
  id: number
  request_type: 'peer' | 'mentor' | 'mentee'
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester: {
    id: number
    name: string
    email: string
    department?: string
    semester?: number
    profile_picture_url?: string
  }
}

interface Connection {
  id: number
  request_type: 'peer' | 'mentor' | 'mentee'
  status: 'accepted'
  created_at: string
  accepted_at: string
  user_role: 'requester' | 'addressee'
  connected_user: {
    id: number
    name: string
    email: string
    department?: string
    semester?: number
    profile_picture_url?: string
  }
}

export default function BuddiesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [buddyType, setBuddyType] = useState("peers")
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [error, setError] = useState("")
  const [inviteLoading, setInviteLoading] = useState<{ [key: number]: boolean }>({})
  const [sentInvites, setSentInvites] = useState<{ [key: number]: boolean }>({})
  const [respondLoading, setRespondLoading] = useState<{ [key: number]: boolean }>({})
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Load buddies data when type or search changes
  useEffect(() => {
    // Clear any pending timeouts when buddy type changes
    const timeoutId = setTimeout(() => {
      loadBuddies()
    }, searchQuery ? 300 : 0) // Reduced debounce to 300ms for faster search

    return () => clearTimeout(timeoutId)
  }, [buddyType, searchQuery])

  // Load invitations when component mounts
  useEffect(() => {
    loadInvitations()
  }, [])

  // Load connections when component mounts
  useEffect(() => {
    loadConnections()
  }, [])

  const loadBuddies = async () => {
    try {
      // Use searching state if already loaded, loading state only for initial load
      if (loading) {
        setLoading(true)
      } else {
        setSearching(true)
      }
      setError("")
      setSentInvites({}) // Clear sent invites when reloading
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
      setSearching(false)
    }
  }

  const loadInvitations = async () => {
    try {
      setInvitationsLoading(true)
      const response = await buddyAPI.getPendingInvitations()

      if (response.success) {
        setInvitations(response.data.invitations || [])
      } else {
        console.error("Failed to load invitations:", response.message)
      }
    } catch (err) {
      console.error("Error loading invitations:", err)
    } finally {
      setInvitationsLoading(false)
    }
  }

  const loadConnections = async () => {
    try {
      setConnectionsLoading(true)
      const response = await buddyAPI.getAcceptedConnections()

      if (response.success) {
        setConnections(response.data.connections || [])
      } else {
        console.error("Failed to load connections:", response.message)
      }
    } catch (err) {
      console.error("Error loading connections:", err)
    } finally {
      setConnectionsLoading(false)
    }
  }

  // No need for frontend filtering as backend handles search
  const filteredBuddies = buddies

  const handleInvite = async (buddyId: number, buddyType: string) => {
    try {
      setInviteLoading(prev => ({ ...prev, [buddyId]: true }))
      setError("")

      const requestType = buddyType === 'mentors' ? 'mentor' : 'peer'
      const response = await buddyAPI.createConnection(buddyId, requestType)

      if (response.success) {
        setSentInvites(prev => ({ ...prev, [buddyId]: true }))
        // Reload invitations to show the new request
        loadInvitations()
      } else {
        setError(response.message || "Failed to send invite")
      }
    } catch (err: any) {
      console.error("Error sending invite:", err)
      if (err.response?.status === 409) {
        setError("You've already sent a request to this user")
      } else {
        setError(err.response?.data?.message || "Failed to send invite. Please try again.")
      }
    } finally {
      setInviteLoading(prev => ({ ...prev, [buddyId]: false }))
    }
  }

  const handleInvitationResponse = async (invitationId: number, response: "accept" | "decline") => {
    try {
      setRespondLoading(prev => ({ ...prev, [invitationId]: true }))
      
      // Map UI response to API response
      const apiResponse = response === "accept" ? "accepted" : "rejected"
      
      const result = await buddyAPI.respondToInvitation(invitationId, apiResponse)

      if (result.success) {
        // Remove the invitation from the list since it's no longer pending
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        
        // If invitation was accepted, reload connections to show the new connection
        if (apiResponse === "accepted") {
          loadConnections()
        }
      } else {
        console.error("Failed to respond to invitation:", result.message)
        // TODO: Show error toast or message
      }
    } catch (err) {
      console.error("Error responding to invitation:", err)
      // TODO: Show error toast or message
    } finally {
      setRespondLoading(prev => ({ ...prev, [invitationId]: false }))
    }
  }

  const handleChatClick = (connection: Connection) => {
    const user = connection.connected_user
    const queryParams = new URLSearchParams({
      userId: user.id.toString(),
      userName: user.name,
      ...(user.department && { userDepartment: user.department }),
      ...(user.semester && { userSemester: user.semester.toString() }),
      ...(user.profile_picture_url && { userProfilePicture: user.profile_picture_url }),
    })

    router.push(`/buddies/chat?${queryParams.toString()}`)
  }

  const handleBuddyCardClick = (buddy: Buddy) => {
    setSelectedBuddy(buddy)
    setModalOpen(true)
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
                    className="pl-10 pr-10"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
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
                  <Button 
                    onClick={loadBuddies} 
                    className="group mt-2 bg-red-600 hover:bg-red-700 transition-all duration-200 hover:shadow-sm" 
                    size="sm"
                  >
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
                  {!searchQuery && (
                    <Button
                      onClick={() => router.push('/profile?edit=true')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBuddies.map((buddy) => (
                    <Card key={buddy.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleBuddyCardClick(buddy)}>
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

                        {/* Connection Status Button */}
                        {buddy.is_connected ? (
                          <Button
                            className="group w-full bg-green-600 hover:bg-green-600 cursor-not-allowed transition-all duration-200"
                            size="sm"
                            disabled={true}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Connected
                          </Button>
                        ) : buddy.has_pending_request ? (
                          <Button
                            className="group w-full bg-yellow-600 hover:bg-yellow-600 cursor-not-allowed transition-all duration-200"
                            size="sm"
                            disabled={true}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {buddy.is_requester ? "Request Sent" : "Invitation Pending"}
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInvite(buddy.id, buddyType)
                            }}
                            className="group w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:shadow-sm"
                            size="sm"
                            disabled={inviteLoading[buddy.id] || sentInvites[buddy.id]}
                          >
                            <UserPlus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                            {inviteLoading[buddy.id] ? (
                              "Sending..."
                            ) : sentInvites[buddy.id] ? (
                              "Invite Sent"
                            ) : (
                              buddyType === 'mentors' ? 'Request Mentoring' : 'Send Study Invite'
                            )}
                          </Button>
                        )}
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
              
              {invitationsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No pending invitations</p>
                  <p className="text-gray-400 text-sm mt-2">
                    When others send you study invites or mentoring requests, they will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={invitation.requester.profile_picture_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {invitation.requester.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{invitation.requester.name}</h3>
                              <p className="text-sm text-gray-600">
                                {invitation.request_type === "peer" ? "Study collaboration request" : 
                                 invitation.request_type === "mentor" ? "Mentoring request" : "Tutoring offer"}
                              </p>
                              {invitation.requester.department && (
                                <p className="text-sm text-gray-500">
                                  {invitation.requester.department}
                                  {invitation.requester.semester && ` • Semester ${invitation.requester.semester}`}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(invitation.created_at).toLocaleDateString()} at {new Date(invitation.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleInvitationResponse(invitation.id, "accept")}
                              size="sm"
                              className="group bg-green-600 hover:bg-green-700 transition-all duration-200 hover:shadow-sm"
                              disabled={respondLoading[invitation.id]}
                            >
                              <CheckCircle className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:scale-110" />
                              {respondLoading[invitation.id] ? "..." : "Accept"}
                            </Button>
                            <Button
                              onClick={() => handleInvitationResponse(invitation.id, "decline")}
                              size="sm"
                              variant="outline"
                              className="group border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 hover:shadow-sm"
                              disabled={respondLoading[invitation.id]}
                            >
                              <XCircle className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:scale-110" />
                              {respondLoading[invitation.id] ? "..." : "Decline"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Connections</h2>
              
              {connectionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading connections...</p>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <MessageCircle className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-lg">No active connections yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Start by connecting with study buddies in the Discover tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <Card key={connection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={connection.connected_user.profile_picture_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {connection.connected_user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold">{connection.connected_user.name}</h3>
                              <p className="text-sm text-gray-600">
                                {connection.connected_user.department && connection.connected_user.semester 
                                  ? `${connection.connected_user.department} • Semester ${connection.connected_user.semester}`
                                  : connection.connected_user.email
                                }
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {connection.request_type === 'peer' ? 'Study Buddy' : 
                                   connection.user_role === 'requester' ? 'Your Mentor' : 'Your Mentee'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Connected {new Date(connection.accepted_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleChatClick(connection)}
                              className="group border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 hover:shadow-sm"
                            >
                              <MessageCircle className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:scale-110" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Buddy Profile Modal */}
      <BuddyProfileModal 
        buddy={selectedBuddy} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  )
}
