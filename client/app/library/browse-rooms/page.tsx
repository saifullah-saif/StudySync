"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Grid3X3, List, Search } from "lucide-react"

export default function BrowseRoomsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [floorFilter, setFloorFilter] = useState("all")
  const [capacityFilter, setCapacityFilter] = useState("all")

  const rooms = [
    {
      id: 1,
      name: "Group Study Room 1",
      code: "09A01G",
      capacity: 12,
      size: "15 sqm",
      features: ["Whiteboard", "Projector"],
    },
    {
      id: 2,
      name: "Group Study Room 2",
      code: "09A02G",
      capacity: 8,
      size: "12 sqm",
      features: ["Whiteboard"],
    },
    {
      id: 3,
      name: "Silent Study Room 1",
      code: "09B01S",
      capacity: 4,
      size: "8 sqm",
      features: ["Power Outlets"],
    },
    {
      id: 4,
      name: "Group Study Room 3",
      code: "09A03G",
      capacity: 15,
      size: "18 sqm",
      features: ["Whiteboard", "Projector", "TV Screen"],
    },
  ]

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFloor = floorFilter === "all" || room.id.toString() === floorFilter

    const matchesCapacity =
      capacityFilter === "all" ||
      (capacityFilter === "small" && room.capacity <= 6) ||
      (capacityFilter === "medium" && room.capacity > 6 && room.capacity <= 12) ||
      (capacityFilter === "large" && room.capacity > 12)

    return matchesSearch && matchesFloor && matchesCapacity
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
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                </SelectContent>
              </Select>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="All Capacities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Capacities</SelectItem>
                  <SelectItem value="small">Small (1-6)</SelectItem>
                  <SelectItem value="medium">Medium (7-12)</SelectItem>
                  <SelectItem value="large">Large (13+)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{filteredRooms.length} rooms found</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "list" ? "outline" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Listing */}
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {filteredRooms.map((room) => (
            <Card key={room.id} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{room.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{room.code}</p>
                    <Button asChild className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6">
                      <Link href={`/library/room/${room.id}`}>View Details</Link>
                    </Button>
                  </div>
                  <div className="ml-4">
                    <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                      Placeholder Image
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
