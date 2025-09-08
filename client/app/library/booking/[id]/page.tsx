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
import { useAuth } from "@/contexts/auth-context"
import { apiRequest } from "@/lib/api"

interface Room {
  id: number
  name: string
  room_number: string
  capacity: number
  floor_number: number
}

export default function BookingPage({ params }: { params: { id: string } }) {
  const roomId = parseInt(params.id)
  const { user, loading: authLoading } = useAuth()
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [duration, setDuration] = useState("2") // hours
  const [purpose, setPurpose] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  const { seats, loading, error, reserveSeat } = useSeats(roomId)

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await apiRequest.get(`/library-rooms/${roomId}`)
        if (response.success) {
          setRoom(response.data)
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
    if (!room) return

    // For small rooms (capacity < 10), select all seats
    if (room.capacity < 10) {
      if (selectedSeats.length === 0) {
        // Select all seats for room booking
        const allSeatIds = seats.map(seat => seat.seat_number)
        setSelectedSeats(allSeatIds)
      } else {
        // Deselect all seats
        setSelectedSeats([])
      }
    } else {
      // For large rooms, individual seat selection with max 3
      if (selectedSeats.includes(seatId)) {
        setSelectedSeats(prev => prev.filter(id => id !== seatId))
      } else if (selectedSeats.length < 3) {
        setSelectedSeats(prev => [...prev, seatId])
      } else {
        alert('You can only book up to 3 seats at a time')
      }
    }
  }

  const handleConfirmBooking = async () => {
    if (!user) {
      alert('Please log in to make a booking')
      return
    }

    if (!room) {
      alert('Room information not loaded')
      return
    }

    if (!selectedDate || !selectedTime || selectedSeats.length === 0) {
      alert('Please select date, time, and at least one seat')
      return
    }

    console.log('User authenticated:', user)
    console.log('User ID:', user.id)
    console.log('Making booking request...')

    setIsBooking(true)

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60 * 60 * 1000)

      if (room.capacity < 10) {
        // Book entire room
        console.log('Booking entire room with capacity:', room.capacity)
        const response = await apiRequest.post('/reservations', {
          room_id: roomId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          purpose: purpose || 'Room reservation',
          room_capacity: room.capacity
        })

        if (response.success) {
          alert('Room booked successfully!')
          setSelectedSeats([])
          setSelectedTime('')
          setSelectedDate('')
          setPurpose('')
        } else {
          throw new Error(response.message || 'Failed to book room')
        }
      } else {
        // Book individual seats
        console.log('Booking individual seats:', selectedSeats)
        const response = await apiRequest.post('/reservations', {
          room_id: roomId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          purpose: purpose || 'Seat reservation',
          selected_seats: selectedSeats,
          room_capacity: room.capacity
        })

        if (response.success) {
          alert('Seats reserved successfully!')
          setSelectedSeats([])
          setSelectedTime('')
          setSelectedDate('')
          setPurpose('')
        } else {
          throw new Error(response.message || 'Failed to book seats')
        }
      }
    } catch (err: any) {
      console.error('Booking error:', err)
      console.error('Error response:', err.response)
      console.error('Error status:', err.response?.status)
      console.error('Error data:', err.response?.data)
      
      if (err.response?.status === 401) {
        alert('Authentication failed. Please log in again.')
      } else {
        alert(err.message || 'Failed to book room/seats. Please try again.')
      }
    } finally {
      setIsBooking(false)
    }
  }

  const getBookingDescription = () => {
    if (!room) return 'Loading...'
    
    if (room.capacity < 10) {
      return 'Select any seat to book the entire room. Small rooms are booked as a whole unit.'
    } else {
      return 'Select individual seats (maximum 3). Large rooms allow individual seat bookings.'
    }
  }

  const getSelectedSeatsText = () => {
    if (!room) return 'No seats selected'
    
    if (room.capacity < 10) {
      if (selectedSeats.length > 0) {
        return 'Entire room selected'
      }
      return 'No room selected'
    } else {
      if (selectedSeats.length === 0) {
        return 'No seats selected'
      }
      return `${selectedSeats.length} seat(s) selected (max 3)`
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>Loading authentication...</p>
          </div>
        </main>
      </div>
    )
  }

  // Show login required message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Login Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You must be logged in to make a booking.
            </p>
            <Link href="/">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
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
                  {getBookingDescription()}
                </p>

                {/* Debug Authentication Status */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Debug Info:</strong><br/>
                      User: Logged in (ID: {user.id})<br/>
                      Room: {room ? `Loaded (Capacity: ${room.capacity})` : 'Not loaded'}<br/>
                      Selected Seats: {selectedSeats.length}
                    </p>
                  </div>
                )}

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
                    <Label className="dark:text-gray-300">
                      {room && room.capacity < 10 ? 'Room selection:' : 'Selected seats:'}
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 min-h-[50px] flex flex-wrap gap-2">
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {getSelectedSeatsText()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleConfirmBooking}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full"
                      disabled={selectedSeats.length === 0 || !selectedTime || !selectedDate || isBooking}
                    >
                      {isBooking ? 'Booking...' : room && room.capacity < 10 ? 'Book Room' : 'Book Seats'}
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