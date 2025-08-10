"use client"

import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RoomLayout } from "@/components/room-layout"
import { ArrowLeft } from "lucide-react"

export default function AvailabilityPage({ params }: { params: { id: string } }) {
  const roomId = params.id

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Navigation */}
        <div className="flex items-center mb-8">
          <Link href="/library/book-seat" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Information */}
          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardContent className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Availability</h1>
                <h2 className="text-lg text-gray-700 dark:text-gray-300 mb-4">09A01G: Group Study Room 1</h2>

                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  See which seats are free, reserved, or occupied. Updated in real time.
                </p>

                {/* Legend */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Legend</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded"></div>
                      <span className="dark:text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded"></div>
                      <span className="dark:text-gray-300">Booked</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-red-500 rounded"></div>
                      <span className="dark:text-gray-300">Occupied</span>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full"
                >
                  <Link href={`/library/booking/${roomId}`}>Book Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Room Map */}
          <div>
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
