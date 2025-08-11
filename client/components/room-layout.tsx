"use client"

interface Seat {
  id: string
  x: number
  y: number
  status: "available" | "booked" | "occupied" | "selected"
}

interface RoomLayoutProps {
  mode: "view" | "book"
  selectedSeats?: string[]
  onSeatClick?: (seatId: string) => void
  capacity?: number
  roomCode?: string
}

export function RoomLayout({ mode, selectedSeats = [], onSeatClick, capacity = 12, roomCode = "ROOM" }: RoomLayoutProps) {
  // Determine room type from room code or name
  const getRoomTypeFromCode = (code: string): string => {
    const codeUpper = code.toUpperCase()
    if (codeUpper.includes('C') || codeUpper.includes('CONF')) return 'conference'
    if (codeUpper.includes('S') || codeUpper.includes('STUDY')) return 'study'
    if (codeUpper.includes('M') || codeUpper.includes('MEET')) return 'meeting'
    return 'conference' // default
  }

  // Generate seats based on the layout shown in the image
  const generateSeats = (totalSeats: number): Seat[] => {
    const seats: Seat[] = []

    // Layout based on the provided image: seats around a central table
    const centerX = 200
    const centerY = 100
    const tableWidth = 140
    const tableHeight = 60

    // Define seat positions around the table like in the image
    const positions: { x: number, y: number }[] = []

    // Top row (5 seats)
    for (let i = 0; i < 5; i++) {
      positions.push({
        x: centerX - tableWidth/2 + (i * tableWidth/4),
        y: centerY - tableHeight/2 - 30
      })
    }

    // Right side (2 seats)
    positions.push({
      x: centerX + tableWidth/2 + 30,
      y: centerY - 15
    })
    positions.push({
      x: centerX + tableWidth/2 + 30,
      y: centerY + 15
    })

    // Bottom row (5 seats)
    for (let i = 0; i < 5; i++) {
      positions.push({
        x: centerX - tableWidth/2 + (i * tableWidth/4),
        y: centerY + tableHeight/2 + 30
      })
    }

    // Use only the number of seats needed, up to the capacity
    for (let i = 0; i < Math.min(totalSeats, positions.length); i++) {
      const seatNumber = String(i + 1).padStart(2, '0')
      const isBooked = Math.random() < 0.25

      seats.push({
        id: `${roomCode}-${seatNumber}`,
        x: positions[i].x,
        y: positions[i].y,
        status: isBooked ? "booked" : "available"
      })
    }

    return seats
  }

  const seats = generateSeats(capacity)

  const getSeatColor = (seat: Seat) => {
    if (mode === "book" && selectedSeats.includes(seat.id)) {
      return "#3B82F6" // Blue for selected
    }

    switch (seat.status) {
      case "available":
        return "#F3F4F6" // Light gray
      case "booked":
        return "#3B82F6" // Blue
      case "occupied":
        return "#EF4444" // Red
      default:
        return "#F3F4F6"
    }
  }

  const getSeatStroke = (seat: Seat) => {
    if (mode === "book" && selectedSeats.includes(seat.id)) {
      return "#1E40AF" // Darker blue for selected border
    }
    return "#D1D5DB" // Gray border
  }

  const handleSeatClick = (seat: Seat) => {
    if (mode === "book" && onSeatClick && (seat.status === "available" || selectedSeats.includes(seat.id))) {
      onSeatClick(seat.id)
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
            <rect
              x={seat.x - 15}
              y={seat.y - 10}
              width="30"
              height="20"
              fill={getSeatColor(seat)}
              stroke={getSeatStroke(seat)}
              strokeWidth={mode === "book" && selectedSeats.includes(seat.id) ? "3" : "2"}
              rx="3"
              className={
                mode === "book" && (seat.status === "available" || selectedSeats.includes(seat.id))
                  ? "cursor-pointer hover:opacity-80"
                  : ""
              }
              onClick={() => handleSeatClick(seat)}
            />
            <text x={seat.x} y={seat.y + 2} textAnchor="middle" className="text-xs fill-gray-700 pointer-events-none">
              {seat.id.split("-")[1]}
            </text>
          </g>
        ))}
      </svg>

      {/* Layout label */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">Layout</div>
    </div>
  )
}
