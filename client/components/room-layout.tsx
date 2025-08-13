"use client"

import { useEffect, useState } from 'react'
import { useSeats, type Seat as DatabaseSeat } from '@/hooks/useSeats'

interface Seat {
  id: string
  x: number
  y: number
  status: "available" | "booked" | "occupied" | "selected"
  seatNumber: string
  hasComputer?: boolean
  hasPowerOutlet?: boolean
  isAccessible?: boolean
}

interface RoomLayoutProps {
  mode: "view" | "book"
  selectedSeats?: string[]
  onSeatClick?: (seatId: string) => void
  capacity?: number
  roomCode?: string
  roomId?: number
}

export function RoomLayout({ mode, selectedSeats = [], onSeatClick, capacity = 12, roomCode = "ROOM", roomId }: RoomLayoutProps) {
  const { seats: databaseSeats, loading, error, reserveSeat } = useSeats(roomId || null)
  const [seats, setSeats] = useState<Seat[]>([])

  // Determine room type from room code or name
  const getRoomTypeFromCode = (code: string): string => {
    const codeUpper = code.toUpperCase()
    if (codeUpper.includes('C') || codeUpper.includes('CONF')) return 'conference'
    if (codeUpper.includes('S') || codeUpper.includes('STUDY')) return 'study'
    if (codeUpper.includes('M') || codeUpper.includes('MEET')) return 'meeting'
    return 'conference' // default
  }

  // Convert database seats to layout seats
  const convertDatabaseSeatsToLayout = (dbSeats: DatabaseSeat[]): Seat[] => {
    return dbSeats.map(dbSeat => {
      const hasActiveReservation = dbSeat.reservations && dbSeat.reservations.length > 0
      let status: "available" | "booked" | "occupied" | "selected" = "available"

      if (hasActiveReservation) {
        const reservation = dbSeat.reservations[0]
        status = reservation.status === 'occupied' ? 'occupied' : 'booked'
      }

      return {
        id: `${roomCode}-${dbSeat.seat_number}`,
        x: Number(dbSeat.position_x) || 0,
        y: Number(dbSeat.position_y) || 0,
        status,
        seatNumber: dbSeat.seat_number.slice(-2), // Only show last 2 digits
        hasComputer: dbSeat.has_computer,
        hasPowerOutlet: dbSeat.has_power_outlet,
        isAccessible: dbSeat.is_accessible
      }
    })
  }

  // Update seats when database data changes
  useEffect(() => {
    if (databaseSeats && databaseSeats.length > 0) {
      setSeats(convertDatabaseSeatsToLayout(databaseSeats))
    } else {
      setSeats([]) // Only show database seats
    }
  }, [databaseSeats, roomCode])

  const getSeatColor = (seat: Seat) => {
    if (mode === "book" && selectedSeats.includes(seat.id)) {
      return "#3B82F6" // Blue for selected
    }

    // If seat is not accessible, show as red
    if (seat.isAccessible === false) {
      return "#EF4444" // Red for non-accessible
    }

    switch (seat.status) {
      case "available":
        return "#10B981" // Green for available
      case "booked":
        return "#F59E0B" // Orange for booked
      case "occupied":
        return "#EF4444" // Red for occupied
      default:
        return "#6B7280" // Gray for neutral
    }
  }

  const getSeatStroke = (seat: Seat) => {
    if (mode === "book" && selectedSeats.includes(seat.id)) {
      return "#1E40AF" // Darker blue for selected border
    }
    return "#D1D5DB" // Gray border
  }

  const handleSeatClick = async (seat: Seat) => {
    // Don't allow interaction with non-accessible seats
    if (seat.isAccessible === false) {
      alert('This seat is not accessible.')
      return
    }

    if (mode === "book" && onSeatClick && (seat.status === "available" || selectedSeats.includes(seat.id))) {
      onSeatClick(seat.id)
    } else if (mode === "view" && seat.status === "available" && roomId) {
      // Quick reservation for 2 hours from now
      try {
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours

        await reserveSeat(
          parseInt(seat.seatNumber),
          startTime,
          endTime,
          'Quick reservation'
        )
      } catch (err) {
        console.error('Failed to reserve seat:', err)
        alert('Failed to reserve seat. Please try again.')
      }
    }
  }

  return (
    <div className="w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-200 relative overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 400 200" className="absolute inset-0">
        {/* Central Table */}
        <rect x="130" y="70" width="140" height="60" fill="#8B5CF6" stroke="#374151" strokeWidth="2" rx="8" />
        <text x="200" y="105" textAnchor="middle" className="text-xs fill-white font-medium">
          Table
        </text>

        {/* Seats */}
        {seats.map((seat) => (
          <g key={seat.id}>
            {/* Main seat rectangle - bigger size */}
            <rect
              x={seat.x - 25}
              y={seat.y - 15}
              width="50"
              height="30"
              fill={getSeatColor(seat)}
              stroke={getSeatStroke(seat)}
              strokeWidth={mode === "book" && selectedSeats.includes(seat.id) ? "3" : "2"}
              rx="6"
              className={
                (mode === "book" && (seat.status === "available" || selectedSeats.includes(seat.id))) ||
                (mode === "view" && seat.status === "available" && seat.isAccessible !== false)
                  ? "cursor-pointer hover:opacity-80"
                  : ""
              }
              onClick={() => handleSeatClick(seat)}
            />

            {/* Seat number */}
            <text
              x={seat.x}
              y={seat.y + 3}
              textAnchor="middle"
              className="text-sm font-bold fill-white pointer-events-none"
              style={{ fontSize: '12px' }}
            >
              {seat.seatNumber}
            </text>

            {/* Computer icon - desktop monitor */}
            {seat.hasComputer && (
              <g className="pointer-events-none">
                {/* Monitor screen */}
                <rect
                  x={seat.x - 8}
                  y={seat.y - 35}
                  width="16"
                  height="12"
                  fill="#374151"
                  stroke="#1F2937"
                  strokeWidth="1"
                  rx="2"
                />
                {/* Monitor stand */}
                <rect
                  x={seat.x - 2}
                  y={seat.y - 23}
                  width="4"
                  height="6"
                  fill="#374151"
                />
                {/* Monitor base */}
                <rect
                  x={seat.x - 6}
                  y={seat.y - 17}
                  width="12"
                  height="2"
                  fill="#374151"
                  rx="1"
                />
              </g>
            )}

            {/* Power outlet icon - electricity symbol */}
            {seat.hasPowerOutlet && (
              <g className="pointer-events-none">
                {/* Outlet background */}
                <rect
                  x={seat.x + 15}
                  y={seat.y - 35}
                  width="12"
                  height="12"
                  fill="#FBBF24"
                  stroke="#F59E0B"
                  strokeWidth="1"
                  rx="2"
                />
                {/* Lightning bolt */}
                <path
                  d={`M${seat.x + 19} ${seat.y - 32} L${seat.x + 22} ${seat.y - 29} L${seat.x + 20} ${seat.y - 29} L${seat.x + 23} ${seat.y - 26} L${seat.x + 20} ${seat.y - 26} L${seat.x + 22} ${seat.y - 24}`}
                  fill="#FFFFFF"
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                />
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Layout label */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">Layout</div>
    </div>
  )
}