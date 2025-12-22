"use client";

import { useEffect, useState } from "react";
import { useSeats, type Seat as DatabaseSeat } from "@/hooks/useSeats";
import { libraryAPI } from "@/lib/api";

interface Seat {
  id: string;
  x: number;
  y: number;
  status: "available" | "booked" | "occupied" | "selected";
  seatNumber: string;
  hasComputer?: boolean;
  hasPowerOutlet?: boolean;
  isAccessible?: boolean;
}

interface RoomLayoutProps {
  mode: "view" | "book";
  selectedSeats?: string[];
  onSeatClick?: (seatId: string) => void;
  capacity?: number;
  roomCode?: string;
  roomId?: number;
  startTime?: string;
  endTime?: string;
  interactive?: boolean; // Controls whether seats can be clicked
}

export function RoomLayout({
  mode,
  selectedSeats = [],
  onSeatClick,
  capacity = 12,
  roomCode = "ROOM",
  roomId,
  startTime,
  endTime,
  interactive = true,
}: RoomLayoutProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [allSeats, setAllSeats] = useState<DatabaseSeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all seats for the room (without time-specific reservations)
  const fetchAllSeats = async () => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await libraryAPI.getRoomSeats(roomId);

      if (data.success) {
        setAllSeats(data.data);
      } else {
        setError(data.message || "Failed to fetch seats");
      }
    } catch (err) {
      setError("Failed to fetch seats");
      console.error("Error fetching seats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch booked seats for the specific time period
  const fetchBookedSeats = async () => {
    if (!roomId || !startTime || !endTime) {
      setBookedSeats([]);
      return;
    }

    try {
      const data = await libraryAPI.getBookedSeats(roomId, startTime, endTime);
      if (data.success) {
        setBookedSeats(data.bookedSeats || []);
      }
    } catch (error) {
      console.error("Error fetching booked seats:", error);
      setBookedSeats([]);
    }
  };

  // Determine room type from room code or name
  const getRoomTypeFromCode = (code: string): string => {
    const codeUpper = code.toUpperCase();
    if (codeUpper.includes("C") || codeUpper.includes("CONF"))
      return "conference";
    if (codeUpper.includes("S") || codeUpper.includes("STUDY")) return "study";
    if (codeUpper.includes("M") || codeUpper.includes("MEET")) return "meeting";
    return "conference"; // default
  };

  // Convert database seats to layout seats
  const convertDatabaseSeatsToLayout = (dbSeats: DatabaseSeat[]): Seat[] => {
    return dbSeats.map((dbSeat) => {
      // For time-specific booking, ignore current reservations and use bookedSeats array
      const isBookedForTimeSlot = bookedSeats.includes(dbSeat.seat_number);
      let status: "available" | "booked" | "occupied" | "selected" =
        "available";

      if (isBookedForTimeSlot) {
        status = "booked"; // Show as booked for the selected time period
      }

      return {
        id: dbSeat.seat_number, // Use the database seat number directly
        x: Number(dbSeat.position_x) || 0,
        y: Number(dbSeat.position_y) || 0,
        status,
        seatNumber: dbSeat.seat_number.slice(-2), // Only show last 2 digits
        hasComputer: dbSeat.has_computer,
        hasPowerOutlet: dbSeat.has_power_outlet,
        isAccessible: dbSeat.is_accessible,
      };
    });
  };

  // Fetch all seats when room changes
  useEffect(() => {
    fetchAllSeats();
  }, [roomId]);

  // Fetch booked seats when time parameters change
  useEffect(() => {
    fetchBookedSeats();
  }, [roomId, startTime, endTime]);

  // Update seats when database data or booked seats change
  useEffect(() => {
    if (allSeats && allSeats.length > 0) {
      setSeats(convertDatabaseSeatsToLayout(allSeats));
    } else {
      setSeats([]); // Only show database seats
    }
  }, [allSeats, bookedSeats, roomCode]);

  const getSeatColor = (seat: Seat) => {
    if (mode === "book" && selectedSeats.includes(seat.id)) {
      return "#3B82F6"; // Blue for selected
    }

    switch (seat.status) {
      case "available":
        return "#10B981"; // Green for available
      case "booked":
        return "#F59E0B"; // Orange for booked
      case "occupied":
        return "#EF4444"; // Red for occupied
      default:
        return "#6B7280"; // Gray for neutral
    }
  };

  const getSeatStroke = (seat: Seat) => {
    if (mode === "book" && selectedSeats.includes(seat.id)) {
      return "#1E40AF"; // Darker blue for selected border
    }
    return "#D1D5DB"; // Gray border
  };

  // Reserve seat function (for view mode)
  const reserveSeat = async (
    seatId: number,
    startTime: Date,
    endTime: Date,
    purpose?: string
  ) => {
    try {
      const data = await libraryAPI.reserveSeat(seatId, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: purpose || "Quick reservation",
      });

      if (data.success) {
        // Refresh seats after successful reservation
        fetchAllSeats();
        fetchBookedSeats();
      } else {
        throw new Error(data.message || "Failed to reserve seat");
      }
    } catch (error) {
      console.error("Error reserving seat:", error);
      throw error;
    }
  };

  const handleSeatClick = async (seat: Seat) => {
    // Do nothing if interactive is disabled
    if (!interactive) return;

    // Only allow interaction with available seats or already selected seats
    if (
      mode === "book" &&
      onSeatClick &&
      (seat.status === "available" || selectedSeats.includes(seat.id))
    ) {
      onSeatClick(seat.id);
    } else if (mode === "view" && seat.status === "available" && roomId) {
      // Quick reservation for 2 hours from now
      try {
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours

        await reserveSeat(
          parseInt(seat.seatNumber),
          startTime,
          endTime,
          "Quick reservation"
        );
      } catch (err) {
        console.error("Failed to reserve seat:", err);
        alert("Failed to reserve seat. Please try again.");
      }
    }
  };

  return (
    <div className="w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-200 relative overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 200"
        className="absolute inset-0"
      >
        {/* Central Table */}
        <rect
          x="130"
          y="70"
          width="140"
          height="60"
          fill="#8B5CF6"
          stroke="#374151"
          strokeWidth="2"
          rx="8"
        />
        <text
          x="200"
          y="105"
          textAnchor="middle"
          className="text-xs fill-white font-medium"
        >
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
              strokeWidth={
                mode === "book" && selectedSeats.includes(seat.id) ? "3" : "2"
              }
              rx="6"
              className={
                interactive &&
                ((mode === "book" &&
                  (seat.status === "available" ||
                    selectedSeats.includes(seat.id))) ||
                (mode === "view" && seat.status === "available"))
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
              style={{ fontSize: "12px" }}
            >
              {seat.seatNumber}
            </text>
          </g>
        ))}

        {/* Icons on top of seats */}
        {seats.map((seat) => (
          <g key={`icons-${seat.id}`}>
            {/* Computer icon - smaller desktop monitor */}
            {seat.hasComputer && (
              <g className="pointer-events-none">
                {/* Monitor screen */}
                <rect
                  x={seat.x - 6}
                  y={seat.y - 25}
                  width="12"
                  height="8"
                  fill="#374151"
                  stroke="#1F2937"
                  strokeWidth="1"
                  rx="1"
                />
                {/* Monitor stand */}
                <rect
                  x={seat.x - 1.5}
                  y={seat.y - 17}
                  width="3"
                  height="4"
                  fill="#374151"
                />
                {/* Monitor base */}
                <rect
                  x={seat.x - 4.5}
                  y={seat.y - 13}
                  width="9"
                  height="1.5"
                  fill="#374151"
                  rx="0.5"
                />
              </g>
            )}

            {/* Power outlet icon - smaller electricity symbol */}
            {seat.hasPowerOutlet && (
              <g className="pointer-events-none">
                {/* Outlet background */}
                <rect
                  x={seat.x + 12}
                  y={seat.y - 25}
                  width="8"
                  height="8"
                  fill="#FBBF24"
                  stroke="#F59E0B"
                  strokeWidth="1"
                  rx="1"
                />
                {/* Lightning bolt */}
                <path
                  d={`M${seat.x + 15} ${seat.y - 23} L${seat.x + 17} ${
                    seat.y - 21
                  } L${seat.x + 16} ${seat.y - 21} L${seat.x + 18} ${
                    seat.y - 19
                  } L${seat.x + 16} ${seat.y - 19} L${seat.x + 17} ${
                    seat.y - 18
                  }`}
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
      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
        Layout
      </div>
    </div>
  );
}
