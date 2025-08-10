"use client"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Wifi, Monitor, Coffee } from "lucide-react"
import Link from "next/link"

export default function LibraryPage() {
  const rooms = [
    {
      id: 1,
      name: "Study Room A1",
      floor: 1,
      capacity: 4,
      features: ["Whiteboard", "WiFi", "Power Outlets"],
      availability: "available",
      nextAvailable: null,
    },
    {
      id: 2,
      name: "Study Room A2",
      floor: 1,
      capacity: 6,
      features: ["Whiteboard", "WiFi", "Monitor", "Power Outlets"],
      availability: "occupied",
      nextAvailable: "2:00 PM",
    },
    {
      id: 3,
      name: "Group Study B1",
      floor: 2,
      capacity: 8,
      features: ["Whiteboard", "WiFi", "Monitor", "Coffee Machine"],
      availability: "available",
      nextAvailable: null,
    },
    {
      id: 4,
      name: "Silent Study C1",
      floor: 3,
      capacity: 2,
      features: ["WiFi", "Power Outlets"],
      availability: "reserved",
      nextAvailable: "4:00 PM",
    },
  ]

  const seats = [
    { id: 1, section: "A", number: 1, status: "available", floor: 1 },
    { id: 2, section: "A", number: 2, status: "occupied", floor: 1 },
    { id: 3, section: "A", number: 3, status: "reserved", floor: 1 },
    { id: 4, section: "B", number: 1, status: "available", floor: 2 },
    { id: 5, section: "B", number: 2, status: "available", floor: 2 },
    { id: 6, section: "C", number: 1, status: "occupied", floor: 3 },
  ]

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "WiFi":
        return <Wifi className="w-4 h-4" />
      case "Monitor":
        return <Monitor className="w-4 h-4" />
      case "Coffee Machine":
        return <Coffee className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "reserved":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const handleBookRoom = (roomId: number) => {
    console.log("Booking room:", roomId)
  }

  const handleBookSeat = (seatId: number) => {
    console.log("Booking seat:", seatId)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden mb-8">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home1.jpg-oQhj3NWcHKnsAYk79n7yx0csiJKyjQ.jpeg')`,
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 px-8 py-16 md:py-24 text-center text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Welcome to the Library Seat &<br />
              Study Room Reservation System
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-4xl mx-auto leading-relaxed">
              Find your perfect study space with ease. Browse available rooms, check real-time seat availability, and
              book your slot: all in one place.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 rounded-full text-lg min-w-[200px]"
          >
            <Link href="/library/book-seat">Book A Seat</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 rounded-full text-lg min-w-[200px]"
          >
            <Link href="/library/browse-rooms">Browse Rooms</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
