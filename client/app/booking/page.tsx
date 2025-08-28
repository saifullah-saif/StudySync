"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Clock, Calendar, Users, MapPin, Search } from "lucide-react"
import { RoomLayout } from "@/components/room-layout"

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedRoomId = searchParams.get('roomId')

  // State variables
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedStartTime, setSelectedStartTime] = useState("")
  const [selectedEndTime, setSelectedEndTime] = useState("")
  const [purpose, setPurpose] = useState("")
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [isBooking, setIsBooking] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("all")
  const [featureFilter, setFeatureFilter] = useState("all")
  const [sortBy, setSortBy] = useState("room_number")

  // Room data
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Time slot generation
  const getAvailableDates = () => {
    const dates = []
    for (let i = 0; i < 5; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      let displayText = ''
      if (i === 0) {
        displayText = 'Today'
      } else if (i === 1) {
        displayText = 'Tomorrow'
      } else {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        displayText = `${dayName}, ${dateStr}`
      }

      dates.push({
        value: date.toISOString().split('T')[0],
        display: displayText
      })
    }
    return dates
  }

  // Convert 24-hour to 12-hour format
  const formatTime12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
    const valueStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    return { display: timeStr, value: valueStr }
  }

  const getAvailableTimeSlots = (isStartTime = true) => {
    if (!selectedDate) return []

    const slots = []
    const now = new Date()
    const selectedDateObj = new Date(selectedDate)
    const isToday = selectedDateObj.toDateString() === now.toDateString()

    // For start time, begin from current slot if today
    let startHour = 9
    let startMinute = 0
    let endHour = 20

    if (isToday && isStartTime) {
      const currentMinutes = now.getMinutes()
      const roundedMinutes = currentMinutes < 30 ? 0 : 30
      startHour = now.getHours()
      startMinute = roundedMinutes

      // If current time is past 8 PM, no slots available
      if (startHour >= 20) return []
    }

    // For end time, start from selected start time + 30 minutes and limit to +3 hours
    if (!isStartTime && selectedStartTime) {
      const [startH, startM] = selectedStartTime.split(':').map(Number)
      startHour = startH
      startMinute = startM + 30

      if (startMinute >= 60) {
        startHour += 1
        startMinute = 0
      }

      // Limit end time to +3 hours from start time, but not past 8 PM
      endHour = Math.min(startH + 3, 20)
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 30) {
        if (hour === 20 && minute > 0) break // Stop at 8:00 PM
        if (hour === endHour && minute > 0 && !isStartTime) break // For end time, don't go past the hour limit

        const timeFormat = formatTime12Hour(hour, minute)
        slots.push(timeFormat)
      }
    }

    return slots
  }

  // Check if room is available for selected time period
  const checkRoomAvailability = async (roomId: number) => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      return true // If no time selected, assume available
    }

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`)
      const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`)

      const response = await axios.get(`/reservations/room/${roomId}/check-availability`, {
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        withCredentials: true,
        params: {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        }
      })

      return response.data.available !== false
    } catch (error) {
      console.error(`Error checking availability for room ${roomId}:`, error)
      return true // Default to available if check fails
    }
  }

  // Get booked seats for the selected time period
  const getBookedSeats = async (roomId: number) => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      return []
    }

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`)
      const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`)

      const response = await axios.get(`/seats/room/${roomId}/booked`, {
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        withCredentials: true,
        params: {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        }
      })

      return response.data.bookedSeats || []
    } catch (error) {
      console.error(`Error fetching booked seats for room ${roomId}:`, error)
      return []
    }
  }

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await axios.get("/library-rooms", {
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        withCredentials: true,
        timeout: 10000,
      })

      if (response.data.success) {
        let roomsData = response.data.data

        // Filter out unavailable rooms if time period is selected
        if (selectedDate && selectedStartTime && selectedEndTime) {
          const availableRooms = []
          for (const room of roomsData) {
            const isAvailable = await checkRoomAvailability(room.id)
            if (isAvailable) {
              availableRooms.push(room)
            }
          }
          roomsData = availableRooms
        }

        setRooms(roomsData)

        // If there's a pre-selected room, set it (only if it's available)
        if (preSelectedRoomId) {
          const preSelected = roomsData.find((room: any) => room.id === parseInt(preSelectedRoomId))
          if (preSelected) {
            setSelectedRoom(preSelected)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle seat selection
  const handleSeatSelection = (seatId: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId)
      } else {
        // Limit to maximum 3 seats
        if (prev.length >= 3) {
          alert('You can only select up to 3 seats at a time')
          return prev
        }
        return [...prev, seatId]
      }
    })
  }

  // Format room number
  const formatRoomNumber = (room: any) => {
    if (!room) return ""
    return `${room.floor_number || ""}${room.room_number || ""}`
  }

  // Filter and sort rooms
  const filteredRooms = rooms.filter(room => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const roomNumber = formatRoomNumber(room).toLowerCase()
      const roomName = (room.name || '').toLowerCase()
      if (!roomNumber.includes(query) && !roomName.includes(query)) {
        return false
      }
    }

    // Capacity filter
    if (capacityFilter !== "all") {
      const capacity = room.capacity || 0
      switch (capacityFilter) {
        case "1-3":
          if (capacity < 1 || capacity > 3) return false
          break
        case "4-8":
          if (capacity < 4 || capacity > 8) return false
          break
        case "9-15":
          if (capacity < 9 || capacity > 15) return false
          break
        case "16+":
          if (capacity < 16) return false
          break
      }
    }

    // Feature filter
    if (featureFilter !== "all") {
      const features = room.features || []
      if (!features.includes(featureFilter)) {
        return false
      }
    }

    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "room_number":
        return formatRoomNumber(a).localeCompare(formatRoomNumber(b))
      case "capacity":
        return (b.capacity || 0) - (a.capacity || 0)
      case "floor":
        return (a.floor_number || 0) - (b.floor_number || 0)
      default:
        return 0
    }
  })

  // Check if booking is valid
  const isBookingValid = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime || !selectedRoom) {
      return false
    }

    // For large rooms, require seat selection
    if ((selectedRoom.capacity || 0) >= 10 && selectedSeats.length === 0) {
      return false
    }

    return true
  }

  // Debug function to check room capacity
  const debugRoomCapacity = () => {
    if (selectedRoom) {
      console.log('Selected room debug:', {
        id: selectedRoom.id,
        name: selectedRoom.name,
        capacity: selectedRoom.capacity,
        isLargeRoom: (selectedRoom.capacity || 0) >= 10,
        selectedSeatsCount: selectedSeats.length
      })
    }
  }

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    debugRoomCapacity() // Debug room info

    if (!isBookingValid()) {
      alert('Please complete all required fields')
      return
    }

    // Validate seat limit
    if (selectedSeats.length > 3) {
      alert('You can only book up to 3 seats at a time')
      return
    }

    setIsBooking(true)
    try {
      // Create proper datetime objects with timezone handling
      const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`)
      const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`)

      console.log('Booking data:', {
        room_id: selectedRoom.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: purpose || 'Room reservation',
        selected_seats: selectedSeats,
        selected_seats_count: selectedSeats.length,
        room_capacity: selectedRoom.capacity,
        local_start: startDateTime.toLocaleString(),
        local_end: endDateTime.toLocaleString()
      })

      const response = await axios.post("/reservations", {
        room_id: selectedRoom.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: purpose || 'Room reservation',
        selected_seats: selectedSeats,
        room_capacity: selectedRoom.capacity || 0
      }, {
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        withCredentials: true,
      })

      if (response.data.success) {
        // Show success popup and redirect
        alert('Reservation confirmed successfully!')
        router.push('/library')
      } else {
        alert(response.data.message || 'Failed to book room')
      }
    } catch (error: any) {
      console.error("Booking error:", error)
      alert(error.response?.data?.message || 'Failed to book room. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchRooms()
  }, [])

  // Reset end time when start time changes
  useEffect(() => {
    setSelectedEndTime("")
  }, [selectedStartTime])

  // Reset selected seats when room changes
  useEffect(() => {
    setSelectedSeats([])
  }, [selectedRoom])

  // Refresh rooms when time period changes
  useEffect(() => {
    if (selectedDate && selectedStartTime && selectedEndTime) {
      fetchRooms()
    }
  }, [selectedDate, selectedStartTime, selectedEndTime])

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/library')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Browse Rooms</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Book a Room
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Selection and Filter Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Time Selection Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Select Date & Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      {getAvailableDates().map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <Select
                    value={selectedStartTime}
                    onValueChange={setSelectedStartTime}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      {getAvailableTimeSlots(true).map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* End Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <Select
                    value={selectedEndTime}
                    onValueChange={setSelectedEndTime}
                    disabled={!selectedStartTime}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      {getAvailableTimeSlots(false).map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Filter Rooms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <Input
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white dark:bg-gray-700"
                  />
                </div>

                {/* Capacity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacity
                  </label>
                  <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="All Capacities" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <SelectItem value="all">All Capacities</SelectItem>
                      <SelectItem value="1-3">1-3 people</SelectItem>
                      <SelectItem value="4-8">4-8 people</SelectItem>
                      <SelectItem value="9-15">9-15 people</SelectItem>
                      <SelectItem value="16+">16+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Feature Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Features
                  </label>
                  <Select value={featureFilter} onValueChange={setFeatureFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="All Features" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <SelectItem value="all">All Features</SelectItem>
                      <SelectItem value="projector">Projector</SelectItem>
                      <SelectItem value="whiteboard">Whiteboard</SelectItem>
                      <SelectItem value="air_conditioning">Air Conditioning</SelectItem>
                      <SelectItem value="power_outlets">Power Outlets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Only show when times are selected */}
        {selectedDate && selectedStartTime && selectedEndTime && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Room Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Available Rooms ({filteredRooms.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRoom?.id === room.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          Room
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatRoomNumber(room)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {room.capacity} seats
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Room Details & Layout */}
            {selectedRoom && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{selectedRoom.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Room Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Room Details</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Room: {formatRoomNumber(selectedRoom)}</p>
                      <p>Capacity: {selectedRoom.capacity} people</p>
                      <p>Floor: {selectedRoom.floor_number}</p>
                      {selectedRoom.features && selectedRoom.features.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedRoom.features.map((feature: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
                              >
                                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Layout - Show for all rooms */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {(selectedRoom.capacity || 0) >= 10
                        ? `Select Seats (${selectedSeats.length}/3)`
                        : 'Room Layout'
                      }
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <RoomLayout
                        mode={(selectedRoom.capacity || 0) >= 10 ? "book" : "view"}
                        capacity={selectedRoom.capacity || 12}
                        roomCode={formatRoomNumber(selectedRoom) || "ROOM"}
                        roomId={selectedRoom.id}
                        selectedSeats={selectedSeats}
                        onSeatClick={(selectedRoom.capacity || 0) >= 10 ? handleSeatSelection : undefined}
                        startTime={selectedDate && selectedStartTime ? `${selectedDate}T${selectedStartTime}:00` : undefined}
                        endTime={selectedDate && selectedEndTime ? `${selectedDate}T${selectedEndTime}:00` : undefined}
                      />
                    </div>
                    {(selectedRoom.capacity || 0) >= 10 && selectedSeats.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Selected seats: {selectedSeats.map(seat => seat.split('-').slice(1).join('-')).join(', ')}
                        </p>
                      </div>
                    )}
                    {(selectedRoom.capacity || 0) < 10 && (
                      <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                          <strong>Small Room Booking:</strong> This room will be reserved entirely for your use during the selected time period.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purpose (Optional)
                    </label>
                    <Textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Enter the purpose of your booking..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Confirm Button */}
        {selectedRoom && selectedDate && selectedStartTime && selectedEndTime && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleConfirmBooking}
              disabled={!isBookingValid() || isBooking}
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg"
            >
              {isBooking ? 'Confirming...' : 'Confirm Reservation'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
