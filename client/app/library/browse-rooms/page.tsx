"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RoomLayout } from "@/components/room-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Grid3X3, List, Search } from "lucide-react"
import axios from "axios"

export default function BrowseRoomsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [floorFilter, setFloorFilter] = useState("all")
  const [sortBy, setSortBy] = useState("room_number")
  const [roomTypeFilter, setRoomTypeFilter] = useState("all")
  const [capacityFilter, setCapacityFilter] = useState("all")
  const [selectedFeature, setSelectedFeature] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Helper functions
  const formatFeatureName = (feature: string) => {
    const featureMap: { [key: string]: string } = {
      projector: "Projector",
      whiteboard: "Whiteboard",
      computer: "Computer",
      wifi: "WiFi",
      air_conditioning: "Air Conditioning",
      power_outlets: "Power Outlets",
      tv_screen: "TV Screen",
    }
    return featureMap[feature] || feature.charAt(0).toUpperCase() + feature.slice(1)
  }

  const getRoomType = (name: string) => {
    if (!name) return "other"
    const nameLower = name.toLowerCase()
    if (nameLower.includes("conference")) return "conference"
    if (nameLower.includes("study")) return "study"
    if (nameLower.includes("meeting")) return "meeting"
    if (nameLower.includes("silent")) return "silent"
    return "other"
  }

  const formatRoomNumber = (room: any) => {
    if (!room) return ""
    if (room.floor_number && room.room_number) {
      return `${String(room.floor_number).padStart(2, '0')}${room.room_number}`
    }
    return room.room_number || ""
  }

  useEffect(() => {
    setMounted(true)
    async function fetchRooms() {
      try {
        const response = await axios.get("/library-rooms", {
          baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
          withCredentials: true,
          timeout: 10000,
        })

        if (response.data.success) {
          setRooms(response.data.data)
        } else {
          console.error("Failed to load rooms", response.data)
        }
      } catch (e: any) {
        console.error("Error fetching rooms", e)
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [])

  const filteredAndSortedRooms = rooms
    .filter((room: any) => {
      if (!room) return false

      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (room.name && room.name.toLowerCase().includes(q)) ||
        (room.room_number && String(room.room_number).toLowerCase().includes(q)) ||
        (formatRoomNumber(room).toLowerCase().includes(q))

      const matchesFloor =
        floorFilter === "all" || (room.floor_number != null && String(room.floor_number) === floorFilter)

      const matchesCapacity =
        capacityFilter === "all" ||
        (capacityFilter === "1-4" && (room.capacity || 0) >= 1 && (room.capacity || 0) <= 4) ||
        (capacityFilter === "5-8" && (room.capacity || 0) >= 5 && (room.capacity || 0) <= 8) ||
        (capacityFilter === "9-12" && (room.capacity || 0) >= 9 && (room.capacity || 0) <= 12)

      const matchesRoomType =
        roomTypeFilter === "all" || getRoomType(room.name || "") === roomTypeFilter

      const matchesFacility =
        selectedFeature === "all" ||
        (Array.isArray(room.features) && room.features.includes(selectedFeature))

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "occupied" && room.is_active === true) ||
        (availabilityFilter === "available" && room.is_active === false)

      return matchesSearch && matchesFloor && matchesCapacity && matchesRoomType && matchesFacility && matchesAvailability
    })
    .sort((a: any, b: any) => {
      if (!a || !b) return 0

      switch (sortBy) {
        case "room_number":
          return formatRoomNumber(a).localeCompare(formatRoomNumber(b))
        case "floor":
          return (a.floor_number || 0) - (b.floor_number || 0)
        case "capacity":
          return (b.capacity || 0) - (a.capacity || 0)
        case "name":
          return (a.name || "").localeCompare(b.name || "")
        case "room_type":
          return getRoomType(a.name || "").localeCompare(getRoomType(b.name || ""))
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Navigation */}
        <div className="flex items-center mb-8">
          <Link href="/library" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Rooms</h1>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-8 bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {/* Search */}
              <Select value={searchQuery ? "custom" : "all"} onValueChange={() => {}}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <div className="flex items-center w-full">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <Input
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:outline-none"
                    />
                  </div>
                </SelectTrigger>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="room_number">Room Number</SelectItem>
                  <SelectItem value="floor">Floor</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="room_type">Room Type</SelectItem>
                </SelectContent>
              </Select>

              {/* Floor Filter */}
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="8">Floor 8</SelectItem>
                  <SelectItem value="9">Floor 9</SelectItem>
                </SelectContent>
              </Select>

              {/* Room Type */}
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="silent">Silent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Availability Filter */}
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                </SelectContent>
              </Select>

              {/* Capacity Filter */}
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Capacity" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Capacities</SelectItem>
                  <SelectItem value="1-4">1-4 People</SelectItem>
                  <SelectItem value="5-8">5-8 People</SelectItem>
                  <SelectItem value="9-12">9-12 People</SelectItem>
                </SelectContent>
              </Select>

              {/* Features Dropdown */}
              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Features" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="wifi">WiFi</SelectItem>
                  <SelectItem value="projector">Projector</SelectItem>
                  <SelectItem value="air_conditioning">Air Conditioning</SelectItem>
                  <SelectItem value="whiteboard">Whiteboard</SelectItem>
                  <SelectItem value="computer">Computer</SelectItem>
                  <SelectItem value="power_outlets">Power Outlets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {mounted ? `${filteredAndSortedRooms.length} rooms found` : "Loading..."}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Room Listing */}
        {!mounted || loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400">Loading rooms...</p>
          </div>
        ) : filteredAndSortedRooms.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400">
              No rooms found. {rooms.length > 0 ? "Try adjusting your filters." : "No rooms available."}
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {filteredAndSortedRooms.map((room: any) => (
            <Card key={room.id} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardContent className="p-6 flex flex-col h-full">
                {/* Top Section - Image and Basic Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Room Image
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{room.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mb-1">
                      ({formatRoomNumber(room)})
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Floor {room.floor_number || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Availability Status */}
                <div className="mb-4">
                  {mounted && (
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      room.is_active
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {room.is_active ? "Occupied" : "Available"}
                    </span>
                  )}
                </div>

                {/* Spacer to push buttons to bottom */}
                <div className="flex-1"></div>

                {/* Bottom Section - Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={async () => {
                      try {
                        const res = await axios.get(`/library-rooms/${room.id}`, {
                          baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
                          withCredentials: true,
                        })
                        if (res.data.success) {
                          setSelectedRoom(res.data.data)
                          setDetailsOpen(true)
                        }
                      } catch (e) {
                        console.error("Failed to load room details", e)
                      }
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      // Navigate to booking page
                      window.location.href = `/library/booking/${room.id}`
                    }}
                  >
                    Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-7xl max-h-[95vh] bg-white dark:bg-gray-800 transition-all duration-200 rounded-2xl px-8">
            <DialogHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                    {selectedRoom?.name}
                  </DialogTitle>
                  <p className="text-xl text-gray-600 dark:text-gray-400 font-mono mt-1">
                    ({selectedRoom ? formatRoomNumber(selectedRoom) : ""}) • Floor {selectedRoom?.floor_number || "N/A"}
                  </p>
                </div>
                <div className="ml-6">
                  {mounted && selectedRoom && (
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                      selectedRoom.is_active
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {selectedRoom.is_active ? "Occupied" : "Available"}
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            {selectedRoom ? (
              <div className="space-y-8">
                {/* Room Image */}
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-lg">Placeholder Image</span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Room Details</h3>
                      <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300 text-lg">
                          <span className="font-medium">Capacity:</span> {selectedRoom.capacity} people
                        </p>
                        {selectedRoom.size_sqft && (
                          <p className="text-gray-700 dark:text-gray-300 text-lg">
                            <span className="font-medium">Size:</span> {selectedRoom.size_sqft} sqft
                          </p>
                        )}
                      </div>
                    </div>

                    {Array.isArray(selectedRoom.features) && selectedRoom.features.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedRoom.features.map((feature: string) => (
                            <span
                              key={feature}
                              className="px-4 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-xl font-medium"
                            >
                              {formatFeatureName(feature)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedRoom.description && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                          {selectedRoom.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Room Layout</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 max-w-md">
                      <RoomLayout
                        mode="view"
                        capacity={selectedRoom.capacity || 12}
                        roomCode={formatRoomNumber(selectedRoom) || "ROOM"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-600 dark:text-gray-300">Loading room details...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
