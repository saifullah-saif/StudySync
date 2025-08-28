"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RoomLayout } from "@/components/room-layout"
import { ArrowLeft } from "lucide-react"
import { useSeats } from "@/hooks/useSeats"
import axios from "axios"

export default function BookingPage({ params }: { params: { id: string } }) {
  const roomId = parseInt(params.id)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [duration, setDuration] = useState("2") // hours
  const [purpose, setPurpose] = useState("")
  const [room, setRoom] = useState(null)
  const [isBooking, setIsBooking] = useState(false)

  const { seats, loading, error, reserveSeat } = useSeats(roomId)

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`/library-rooms/${roomId}`, {
          baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
          withCredentials: true,
        })
        if (response.data.success) {
          setRoom(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching room:', err)
      }
    }

    if (roomId) {
      fetchRoom()
    }
  }, [roomId])

  const handleSeatClick = (seatId: string) => {
    setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]))
  }

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || selectedSeats.length === 0) {
      alert('Please select date, time, and at least one seat')
      return
    }

    setIsBooking(true)

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60 * 60 * 1000)

      // Reserve each selected seat
      for (const seatId of selectedSeats) {
        const seatNumber = parseInt(seatId.split('-')[1])
        await reserveSeat(seatNumber, startDateTime, endDateTime, purpose || 'Seat reservation')
      }

      alert('Seats reserved successfully!')
      setSelectedSeats([])
      setSelectedTime('')
      setSelectedDate('')
      setPurpose('')
    } catch (err) {
      console.error('Booking error:', err)
      alert('Failed to book seats. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Navigation */}
        <div className="flex items-center mb-8">
          <Link href={`/library/availability/${roomId}`} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Seat Selection */}
          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking</h1>
                <h2 className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  {room ? `${room.room_number}: ${room.name}` : 'Loading...'}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Select your seat, choose a time slot, and confirm your reservation. Updated in real time.
                </p>

                {/* Interactive Layout Map */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Interactive Layout Map</h3>
                  <RoomLayout
                    mode="book"
                    selectedSeats={selectedSeats}
                    onSeatClick={handleSeatClick}
                    roomId={roomId}
                    capacity={room?.capacity || 12}
                    roomCode={room?.room_number || "ROOM"}
                  />
                </div>


              </CardContent>
            </Card>
          </div>

          {/* Right Side - Reservation Form */}
          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 dark:text-white">Make a Reservation</h3>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="date" className="dark:text-gray-300">
                      Select date:
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time" className="dark:text-gray-300">
                      Select time:
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration" className="dark:text-gray-300">
                      Duration (hours):
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="8"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purpose" className="dark:text-gray-300">
                      Purpose (optional):
                    </Label>
                    <Input
                      id="purpose"
                      type="text"
                      placeholder="Study session, meeting, etc."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <Label className="dark:text-gray-300">Selected seats:</Label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 min-h-[50px] flex flex-wrap gap-2">
                      {selectedSeats.length > 0 ? (
                        selectedSeats.map((seat) => (
                          <span
                            key={seat}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                          >
                            {seat}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No seats selected</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleConfirmBooking}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full"
                      disabled={selectedSeats.length === 0 || !selectedTime || !selectedDate || isBooking}
                    >
                      {isBooking ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-full bg-transparent"
                    >
                      <Link href={`/library/room/${roomId}`}>View Room Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}