"use client"

import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RoomLayout } from "@/components/room-layout"
import { ArrowLeft } from "lucide-react"

export default function RoomDetailsPage({ params }: { params: { id: string } }) {
  const roomId = params.id

  // Mock room data - in real app this would come from API
  const room = {
    id: roomId,
    name: "Group Study Room 1",
    code: "09A01G",
    description:
      "Equipped with a projector and whiteboard; ideal for collaborative work, presentations, and group discussions.",
    size: "15 sqm",
    capacity: "12 People",
    features: "Whiteboard",
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Navigation */}
        <div className="flex items-center mb-8">
          <Link href="/library/browse-rooms" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Room Information */}
          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardContent className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{room.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{room.code}</p>

                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{room.description}</p>

                <div className="space-y-3 mb-8">
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

                <div className="flex gap-4">
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
          </div>

          {/* Right Side - Visuals */}
          <div className="space-y-6">
            {/* Placeholder Image */}
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardContent className="p-6">
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Placeholder Image
                </div>
              </CardContent>
            </Card>

            {/* Layout */}
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Layout</h3>
                <RoomLayout mode="view" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
