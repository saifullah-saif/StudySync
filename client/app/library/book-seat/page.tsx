"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search } from "lucide-react"

export default function BookSeatPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [floorFilter, setFloorFilter] = useState("all")
  const [capacityFilter, setCapacityFilter] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")

  const rooms = [
    {
      id: 1,
      name: "Group Study Room 1",
      size: "15 sqm",
      capacity: "12 People",
      features: "Whiteboard",
    },
    {
      id: 2,
      name: "Group Study Room 2",
      size: "12 sqm",
      capacity: "8 People",
      features: "Whiteboard",
    },
    {
      id: 3,
      name: "Silent Study Room 1",
      size: "8 sqm",
      capacity: "4 People",
      features: "Power Outlets",
    },
    {
      id: 4,
      name: "Group Study Room 3",
      size: "18 sqm",
      capacity: "15 People",
      features: "Whiteboard, Projector",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Navigation */}
        <div className="flex items-center mb-8">
          <Link href="/library" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book a Seat</h1>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-8 bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
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
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="dark:bg-gray-700 dark:border-gray-600"
                placeholder="Select date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Room Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{room.name}</h3>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-medium dark:text-white">{room.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                    <span className="font-medium dark:text-white">{room.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Features:</span>
                    <span className="font-medium dark:text-white">{room.features}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    asChild
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full"
                  >
                    <Link href={`/library/booking/${room.id}`}>Book Now</Link>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full"
                  >
                    <Link href={`/library/availability/${room.id}`}>View Availability</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
