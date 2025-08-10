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
}

export function RoomLayout({ mode, selectedSeats = [], onSeatClick }: RoomLayoutProps) {
  const seats: Seat[] = [
    // Top row
    { id: "09A01G-01", x: 100, y: 50, status: "available" },
    { id: "09A01G-02", x: 150, y: 50, status: "booked" },
    { id: "09A01G-03", x: 200, y: 50, status: "booked" },
    { id: "09A01G-04", x: 250, y: 50, status: "available" },
    { id: "09A01G-05", x: 300, y: 50, status: "available" },

    // Right side
    { id: "09A01G-06", x: 350, y: 100, status: "available" },
    { id: "09A01G-07", x: 350, y: 150, status: "available" },

    // Bottom row
    { id: "09A01G-08", x: 100, y: 200, status: "available" },
    { id: "09A01G-09", x: 150, y: 200, status: "available" },
    { id: "09A01G-10", x: 200, y: 200, status: "booked" },
    { id: "09A01G-11", x: 250, y: 200, status: "booked" },
    { id: "09A01G-12", x: 300, y: 200, status: "available" },
  ]

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
    <div className="w-full h-80 bg-gray-50 rounded-lg border-2 border-gray-200 relative overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 400 250" className="absolute inset-0">
        {/* Central table/projector area */}
        <rect x="175" y="100" width="50" height="50" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" rx="4" />
        <text x="200" y="130" textAnchor="middle" className="text-xs fill-gray-600">
          Projector
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
