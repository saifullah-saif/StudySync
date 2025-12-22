"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buddyAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageCircle,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";
import { BuddyProfileModal } from "./components/buddy-profile-modal";
import { useAuth } from "@/contexts/auth-context";

interface Buddy {
  id: number;
  name: string;
  email: string;
  department: string;
  semester: number;
  profile_picture_url?: string;
  bio?: string;
  sharedCourses: Array<{ code: string; name: string }>;
  currentCourses?: Array<{ code: string; name: string }>;
  previousCourses?: Array<{ code: string; name: string }>;
  type: "peer" | "mentor";
  connection_status?: "pending" | "accepted" | "rejected" | null;
  connection_type?: "peer" | "mentor" | null;
  is_requester?: boolean;
  is_connected?: boolean;
  has_pending_request?: boolean;
}

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  timestamp: string;
  is_read: boolean;
  sender: {
    id: number;
    name: string;
    profile_picture_url?: string;
  };
  receiver: {
    id: number;
    name: string;
    profile_picture_url?: string;
  };
}

interface Invitation {
  id: number;
  request_type: "peer" | "mentor" | "mentee";
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  requester: {
    id: number;
    name: string;
    email: string;
    department?: string;
    semester?: number;
    profile_picture_url?: string;
  };
}

interface Connection {
  id: number;
  request_type: "peer" | "mentor" | "mentee";
  status: "accepted";
  created_at: string;
  accepted_at: string;
  user_role: "requester" | "addressee";
  connected_user: {
    id: number;
    name: string;
    email: string;
    department?: string;
    semester?: number;
    profile_picture_url?: string;
  };
}

export default function BuddiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [buddyType, setBuddyType] = useState("peers");
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [switchingType, setSwitchingType] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLoading, setInviteLoading] = useState<{
    [key: number]: boolean;
  }>({});
  const [sentInvites, setSentInvites] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [respondLoading, setRespondLoading] = useState<{
    [key: number]: boolean;
  }>({});
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [prevBuddyType, setPrevBuddyType] = useState(buddyType);
  const { user } = useAuth();

  // Load buddies data when type or search changes
  useEffect(() => {
    // Detect if buddyType changed
    if (prevBuddyType !== buddyType) {
      setSwitchingType(true);
      setPrevBuddyType(buddyType);
    }

    // Clear any pending timeouts when buddy type changes
    const timeoutId = setTimeout(
      () => {
        loadBuddies();
      },
      searchQuery ? 300 : 0
    ); // Reduced debounce to 300ms for faster search

    return () => clearTimeout(timeoutId);
  }, [buddyType, searchQuery]);

  // Load invitations when component mounts
  useEffect(() => {
    loadInvitations();
  }, []);

  // Load connections when component mounts
  useEffect(() => {
    loadConnections();
  }, []);

  // Load buddies data with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadBuddies();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadBuddies = async () => {
    try {
      // Use appropriate loading state based on action
      if (loading) {
        setLoading(true);
      } else if (switchingType) {
        // Keep switchingType true, will be cleared in finally
      } else {
        setSearching(true);
      }
      setError("");
      setSentInvites({}); // Clear sent invites when reloading
      const response = await buddyAPI.getBuddies(buddyType, searchQuery);

      if (response.success) {
        setBuddies(response.data.buddies);
      } else {
        setError("Failed to load buddies");
      }
    } catch (err) {
      console.error("Error loading buddies:", err);
      setError("Failed to load buddies. Please try again.");
    } finally {
      setLoading(false);
      setSearching(false);
      setSwitchingType(false);
    }
  };

  const loadInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const response = await buddyAPI.getPendingInvitations();

      if (response.success) {
        setInvitations(response.data.invitations || []);
      } else {
        console.error("Failed to load invitations:", response.message);
      }
    } catch (err) {
      console.error("Error loading invitations:", err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      setConnectionsLoading(true);
      const response = await buddyAPI.getAcceptedConnections();

      if (response.success) {
        setConnections(response.data.connections || []);
      } else {
        console.error("Failed to load connections:", response.message);
      }
    } catch (err) {
      console.error("Error loading connections:", err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  // No need for frontend filtering as backend handles search
  const filteredBuddies = buddies;

  const handleInvite = async (buddyId: number, buddyType: string) => {
    try {
      setInviteLoading((prev) => ({ ...prev, [buddyId]: true }));
      setError("");

      const requestType = buddyType === "mentors" ? "mentor" : "peer";
      const response = await buddyAPI.createConnection(buddyId, requestType);

      if (response.success) {
        setSentInvites((prev) => ({ ...prev, [buddyId]: true }));
        // Reload invitations to show the new request
        loadInvitations();
      } else {
        setError(response.message || "Failed to send invite");
      }
    } catch (err: any) {
      console.error("Error sending invite:", err);
      if (err.response?.status === 409) {
        setError("You've already sent a request to this user");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to send invite. Please try again."
        );
      }
    } finally {
      setInviteLoading((prev) => ({ ...prev, [buddyId]: false }));
    }
  };

  const handleInvitationResponse = async (
    invitationId: number,
    response: "accept" | "decline"
  ) => {
    try {
      setRespondLoading((prev) => ({ ...prev, [invitationId]: true }));

      // Map UI response to API response
      const apiResponse = response === "accept" ? "accepted" : "rejected";

      const result = await buddyAPI.respondToInvitation(
        invitationId,
        apiResponse
      );

      if (result.success) {
        // Remove the invitation from the list since it's no longer pending
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

        // If invitation was accepted, reload connections to show the new connection
        if (apiResponse === "accepted") {
          loadConnections();
        }
      } else {
        console.error("Failed to respond to invitation:", result.message);
        // TODO: Show error toast or message
      }
    } catch (err) {
      console.error("Error responding to invitation:", err);
      // TODO: Show error toast or message
    } finally {
      setRespondLoading((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleBuddyCardClick = (buddy: Buddy) => {
    setSelectedBuddy(buddy);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Study Buddies
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Connect with classmates for collaborative learning and peer tutoring
          </p>
        </div>

        <Tabs defaultValue="discover" className="space-y-8">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-white/30 backdrop-blur-md p-1 text-slate-600 border border-white/40 shadow-sm">
            <TabsTrigger
              value="discover"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-1.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:bg-white/60"
            >
              Discover
            </TabsTrigger>
            <TabsTrigger
              value="invitations"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-1.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:bg-white/60"
            >
              Invitations
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-1.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:bg-white/60"
            >
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Transparent Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-300" />
              <Input
                placeholder="Search by name or course starting with...."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-14 bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] focus:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-500 placeholder:text-slate-400 text-slate-900 font-medium"
              />
              {searching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* People You May Know */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 drop-shadow-lg">
                  People You May Know
                </h2>
                <Select value={buddyType} onValueChange={setBuddyType}>
                  <SelectTrigger className="w-40 bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
                    <SelectItem value="peers" className="hover:bg-blue-50/80 transition-colors">Peers</SelectItem>
                    <SelectItem value="mentors" className="hover:bg-blue-50/80 transition-colors">Mentors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading || switchingType ? (
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
                    {searchQuery
                      ? `No ${buddyType} found matching "${searchQuery}"`
                      : buddyType === "mentors"
                      ? "No mentors found for your current courses"
                      : "No peers found with shared courses"}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery
                      ? "Try a different search term or clear the search"
                      : "Try changing your preferences or add more courses to your profile"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => router.push("/profile")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Go to Profile
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {filteredBuddies.map((buddy) => (
                    <Card
                      key={buddy.id}
                      className="group bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] cursor-pointer relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/10 before:to-purple-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
                      onClick={() => handleBuddyCardClick(buddy)}
                    >
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={
                                buddy.profile_picture_url || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-lg">
                              {buddy.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {buddy.name}
                            </CardTitle>
                            <CardDescription className="text-slate-600">
                              {buddy.department} • Semester {buddy.semester}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 relative z-10">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">
                            {buddyType === "mentors"
                              ? "Can help with:"
                              : "Shared Courses:"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {buddy.sharedCourses.map((course, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs bg-blue-50 border-blue-200 text-blue-700 font-medium"
                              >
                                {course.code}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Connection Status Button */}
                        {buddy.is_connected ? (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-600 cursor-not-allowed shadow-md"
                            size="sm"
                            disabled={true}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Connected
                          </Button>
                        ) : buddy.has_pending_request ? (
                          <Button
                            className="w-full bg-yellow-600 hover:bg-yellow-600 cursor-not-allowed shadow-md"
                            size="sm"
                            disabled={true}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {buddy.is_requester
                              ? "Request Sent"
                              : "Invitation Pending"}
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvite(buddy.id, buddyType);
                            }}
                            className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            size="sm"
                            disabled={
                              inviteLoading[buddy.id] || sentInvites[buddy.id]
                            }
                          >
                            <UserPlus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                            {inviteLoading[buddy.id]
                              ? "Sending..."
                              : sentInvites[buddy.id]
                              ? "Invite Sent"
                              : buddyType === "mentors"
                              ? "Request Mentoring"
                              : "Send Study Invite"}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Pending Invitations
              </h2>

              {invitationsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No pending invitations
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    When others send you study invites or mentoring requests,
                    they will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <Card
                      key={invitation.id}
                      className="group bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-500 hover:scale-[1.02] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-purple-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
                    >
                      <CardContent className="pt-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage
                                src={
                                  invitation.requester.profile_picture_url ||
                                  "/placeholder.svg"
                                }
                              />
                              <AvatarFallback className="text-base">
                                {invitation.requester.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {invitation.requester.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {invitation.request_type === "peer"
                                  ? "Study collaboration request"
                                  : invitation.request_type === "mentor"
                                  ? "Mentoring request"
                                  : "Tutoring offer"}
                              </p>
                              {invitation.requester.department && (
                                <p className="text-sm text-gray-500">
                                  {invitation.requester.department}
                                  {invitation.requester.semester &&
                                    ` • Semester ${invitation.requester.semester}`}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  invitation.created_at
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  invitation.created_at
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() =>
                                handleInvitationResponse(
                                  invitation.id,
                                  "accept"
                                )
                              }
                              size="sm"
                              className="group bg-green-600 hover:bg-green-700 transition-all duration-200 hover:shadow-sm"
                              disabled={respondLoading[invitation.id]}
                            >
                              <CheckCircle className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:scale-110" />
                              {respondLoading[invitation.id] ? "..." : "Accept"}
                            </Button>
                            <Button
                              onClick={() =>
                                handleInvitationResponse(
                                  invitation.id,
                                  "decline"
                                )
                              }
                              size="sm"
                              variant="outline"
                              className="group border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 hover:shadow-sm"
                              disabled={respondLoading[invitation.id]}
                            >
                              <XCircle className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:scale-110" />
                              {respondLoading[invitation.id]
                                ? "..."
                                : "Decline"}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Active Connections
              </h2>

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
                  <p className="text-gray-500 text-lg">
                    No active connections yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Start by connecting with study buddies in the Discover tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <Card
                      key={connection.id}
                      className="group bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] cursor-pointer relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-purple-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
                    >
                      <CardContent className="pt-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage
                                src={
                                  connection.connected_user
                                    .profile_picture_url || "/placeholder.svg"
                                }
                              />
                              <AvatarFallback className="text-base">
                                {connection.connected_user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900">
                                {connection.connected_user.name}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {connection.connected_user.department &&
                                connection.connected_user.semester
                                  ? `${connection.connected_user.department} • Semester ${connection.connected_user.semester}`
                                  : connection.connected_user.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 border-blue-200 text-blue-700 font-medium"
                                >
                                  {connection.request_type === "peer"
                                    ? "Study Buddy"
                                    : connection.user_role === "requester"
                                    ? "Your Mentor"
                                    : "Your Mentee"}
                                </Badge>
                                <span className="text-xs text-slate-500 font-medium">
                                  Connected{" "}
                                  {new Date(
                                    connection.accepted_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">
                              Use the floating chat button to message
                            </p>
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
  );
}
