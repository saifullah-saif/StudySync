"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Users, MapPin, Search } from "lucide-react";
import { RoomLayout } from "@/components/room-layout";
import { libraryAPI } from "@/lib/api";
import { toast } from "sonner";

interface BookingModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  preSelectedRoomId?: number;
  onBookingSuccessAction?: () => void;
}

export function BookingModal({
  open,
  onOpenChangeAction,
  preSelectedRoomId,
  onBookingSuccessAction,
}: BookingModalProps) {
  const MAX_RESERVATIONS = 5;

  // State variables
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const [userBookingsCount, setUserBookingsCount] = useState<number | null>(
    null
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [featureFilter, setFeatureFilter] = useState("all");

  // Room data
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const reservationsToCreate = useMemo(() => {
    if (!selectedRoom) return 1;
    const isLargeRoom = (selectedRoom.capacity || 0) >= 10;
    if (!isLargeRoom) return 1;
    return Math.max(1, selectedSeats.length);
  }, [selectedRoom, selectedSeats.length]);

  const wouldExceedLimit = useMemo(() => {
    if (userBookingsCount == null) return false;
    return userBookingsCount + reservationsToCreate > MAX_RESERVATIONS;
  }, [MAX_RESERVATIONS, reservationsToCreate, userBookingsCount]);

  // Time slot generation
  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      let displayText = "";
      if (i === 0) {
        displayText = "Today";
      } else if (i === 1) {
        displayText = "Tomorrow";
      } else {
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        displayText = `${dayName}, ${dateStr}`;
      }

      dates.push({
        value: date.toISOString().split("T")[0],
        display: displayText,
      });
    }
    return dates;
  };

  // Convert 24-hour to 12-hour format
  const formatTime12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const timeStr = `${displayHour}:${minute
      .toString()
      .padStart(2, "0")} ${period}`;
    const valueStr = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    return { display: timeStr, value: valueStr };
  };

  const getAvailableTimeSlots = (isStartTime = true) => {
    if (!selectedDate) return [];

    const slots = [];
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.toDateString() === now.toDateString();

    // For start time, begin from current slot if today
    let startHour = 9;
    let startMinute = 0;
    let endHour = 20;

    if (isToday && isStartTime) {
      const currentMinutes = now.getMinutes();
      const roundedMinutes = currentMinutes < 30 ? 0 : 30;
      startHour = now.getHours();
      startMinute = roundedMinutes;

      // If current time is past 8 PM, no slots available
      if (startHour >= 20) return [];
    }

    // For end time, start from selected start time + 30 minutes and limit to +3 hours
    if (!isStartTime && selectedStartTime) {
      const [startH, startM] = selectedStartTime.split(":").map(Number);
      startHour = startH;
      startMinute = startM + 30;

      if (startMinute >= 60) {
        startHour += 1;
        startMinute = 0;
      }

      // Limit end time to +3 hours from start time, but not past 8 PM
      endHour = Math.min(startH + 3, 20);
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      for (
        let minute = hour === startHour ? startMinute : 0;
        minute < 60;
        minute += 30
      ) {
        if (hour === 20 && minute > 0) break; // Stop at 8:00 PM
        if (hour === endHour && minute > 0 && !isStartTime) break;

        const timeFormat = formatTime12Hour(hour, minute);
        slots.push(timeFormat);
      }
    }

    return slots;
  };

  // Check if room is available for selected time period
  const checkRoomAvailability = async (roomId: number) => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      return true;
    }

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`);

      const response = await axios.get(
        `/reservations/room/${roomId}/check-availability`,
        {
          baseURL:
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
          withCredentials: true,
          params: {
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
          },
        }
      );

      return response.data.available !== false;
    } catch (error) {
      console.error(`Error checking availability for room ${roomId}:`, error);
      return true;
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await axios.get("/library-rooms", {
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        withCredentials: true,
        timeout: 10000,
      });

      if (response.data.success) {
        let roomsData = response.data.data;

        // Filter out unavailable rooms if time period is selected
        if (selectedDate && selectedStartTime && selectedEndTime) {
          const availableRooms = [];
          for (const room of roomsData) {
            const isAvailable = await checkRoomAvailability(room.id);
            if (isAvailable) {
              availableRooms.push(room);
            }
          }
          roomsData = availableRooms;
        }

        setRooms(roomsData);

        // If there's a pre-selected room, set it
        if (preSelectedRoomId) {
          const preSelected = roomsData.find(
            (room: any) => room.id === preSelectedRoomId
          );
          if (preSelected) {
            setSelectedRoom(preSelected);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookingsCount = async () => {
    try {
      const response = await libraryAPI.getUserBookings();
      if (response?.success && Array.isArray(response.data)) {
        setUserBookingsCount(response.data.length);
      } else {
        setUserBookingsCount(0);
      }
    } catch (error) {
      console.error("Error fetching user bookings count:", error);
      setUserBookingsCount(null);
    }
  };

  // Handle seat selection
  const handleSeatSelection = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= 3) {
          toast.warning("Seat limit reached", {
            description: "You can only select up to 3 seats at a time.",
          });
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  // Format room number
  const formatRoomNumber = (room: any) => {
    if (!room) return "";
    return `${room.floor_number || ""}${room.room_number || ""}`;
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const roomNumber = formatRoomNumber(room).toLowerCase();
      const roomName = (room.name || "").toLowerCase();
      if (!roomNumber.includes(query) && !roomName.includes(query)) {
        return false;
      }
    }

    // Capacity filter
    if (capacityFilter !== "all") {
      const capacity = room.capacity || 0;
      switch (capacityFilter) {
        case "1-3":
          if (capacity < 1 || capacity > 3) return false;
          break;
        case "4-8":
          if (capacity < 4 || capacity > 8) return false;
          break;
        case "9-15":
          if (capacity < 9 || capacity > 15) return false;
          break;
        case "16+":
          if (capacity < 16) return false;
          break;
      }
    }

    // Feature filter
    if (featureFilter !== "all") {
      const features = room.features || [];
      if (!features.includes(featureFilter)) {
        return false;
      }
    }

    return true;
  });

  // Check if booking is valid
  const isBookingValid = () => {
    if (
      !selectedDate ||
      !selectedStartTime ||
      !selectedEndTime ||
      !selectedRoom
    ) {
      return false;
    }

    // For large rooms, require seat selection
    if ((selectedRoom.capacity || 0) >= 10 && selectedSeats.length === 0) {
      return false;
    }

    return true;
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!isBookingValid()) {
      toast.error("Missing details", {
        description:
          "Please select date, time, and a room (and seats for large rooms).",
      });
      return;
    }

    if (userBookingsCount != null && userBookingsCount >= MAX_RESERVATIONS) {
      toast.error("Booking limit reached", {
        description: `You already have ${MAX_RESERVATIONS} active bookings. Cancel one to book again.`,
      });
      return;
    }

    if (wouldExceedLimit) {
      toast.error("Too many bookings", {
        description: `This would exceed the maximum limit of ${MAX_RESERVATIONS}. Please cancel an existing booking first.`,
      });
      return;
    }

    if (selectedSeats.length > 3) {
      toast.error("Seat limit exceeded", {
        description: "You can only book up to 3 seats at a time.",
      });
      return;
    }

    setIsBooking(true);
    try {
      const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`);

      const response = await axios.post(
        "/reservations",
        {
          room_id: selectedRoom.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          purpose: purpose || "Room reservation",
          selected_seats: selectedSeats,
          room_capacity: selectedRoom.capacity || 0,
        },
        {
          baseURL:
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("Reservation confirmed", {
          description: `${
            selectedRoom?.name || "Room"
          } booked for ${selectedDate} ${selectedStartTime}–${selectedEndTime}.`,
        });
        onOpenChangeAction(false);
        if (onBookingSuccessAction) {
          onBookingSuccessAction();
        }
        // Reset form
        setSelectedDate("");
        setSelectedStartTime("");
        setSelectedEndTime("");
        setPurpose("");
        setSelectedSeats([]);
        setSelectedRoom(null);
      } else {
        toast.error("Booking failed", {
          description:
            response.data.message || "Failed to book room. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Booking failed", {
        description:
          error.response?.data?.message ||
          "Failed to book room. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Reset end time when start time changes
  useEffect(() => {
    setSelectedEndTime("");
  }, [selectedStartTime]);

  // Reset selected seats when room changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedRoom]);

  // Fetch rooms when modal opens or time period changes
  useEffect(() => {
    if (open) {
      fetchRooms();
      fetchUserBookingsCount();
    }
  }, [open, selectedDate, selectedStartTime, selectedEndTime]);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] sm:max-h-[92vh] bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl overflow-hidden p-0">
        <div className="overflow-y-auto max-h-[95vh] sm:max-h-[92vh] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <DialogHeader className="sticky top-0 bg-white/95 backdrop-blur-xl z-10 pb-3 mb-4 border-b border-slate-200">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
              Book a Room
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Time Selection and Filter Section - Compact Side by Side */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Time Selection Section */}
              <Card className="bg-white/60 backdrop-blur-sm border border-white/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Clock className="h-5 w-5" />
                    <span>Date & Time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <Select
                      value={selectedDate}
                      onValueChange={setSelectedDate}
                    >
                      <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 h-10 text-base">
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Time
                    </label>
                    <Select
                      value={selectedStartTime}
                      onValueChange={setSelectedStartTime}
                      disabled={!selectedDate}
                    >
                      <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 h-10 text-base">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl max-h-60">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      End Time
                    </label>
                    <Select
                      value={selectedEndTime}
                      onValueChange={setSelectedEndTime}
                      disabled={!selectedStartTime}
                    >
                      <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 h-10 text-base">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl max-h-60">
                        {getAvailableTimeSlots(false).map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Search and Filter Section */}
              <Card className="bg-white/60 backdrop-blur-sm border border-white/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Search className="h-5 w-5" />
                    <span>Filter Rooms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Search
                    </label>
                    <Input
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-200 h-10 text-base"
                    />
                  </div>

                  {/* Capacity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Capacity
                    </label>
                    <Select
                      value={capacityFilter}
                      onValueChange={setCapacityFilter}
                    >
                      <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 h-10 text-base">
                        <SelectValue placeholder="All Capacities" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Features
                    </label>
                    <Select
                      value={featureFilter}
                      onValueChange={setFeatureFilter}
                    >
                      <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 h-10 text-base">
                        <SelectValue placeholder="All Features" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
                        <SelectItem value="all">All Features</SelectItem>
                        <SelectItem value="projector">Projector</SelectItem>
                        <SelectItem value="whiteboard">Whiteboard</SelectItem>
                        <SelectItem value="air_conditioning">
                          Air Conditioning
                        </SelectItem>
                        <SelectItem value="power_outlets">
                          Power Outlets
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Only show when times are selected */}
            {selectedDate && selectedStartTime && selectedEndTime && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Left Side - Room Selection */}
                <Card className="bg-white/60 backdrop-blur-sm border border-white/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      <span>Available Rooms ({filteredRooms.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-60 sm:max-h-72 overflow-y-auto">
                      {filteredRooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedRoom?.id === room.id
                              ? "border-blue-500 bg-blue-50/60 backdrop-blur-sm"
                              : "border-white/50 bg-white/40 backdrop-blur-sm hover:border-blue-300"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-xs sm:text-sm font-semibold text-slate-700">
                              Room
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                              {formatRoomNumber(room)}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600">
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
                  <Card className="bg-white/60 backdrop-blur-sm border border-white/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Users className="h-5 w-5" />
                        <span>{selectedRoom.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Room Info */}
                      <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 text-sm">
                        <h4 className="font-semibold text-slate-900 mb-1">
                          Room Details
                        </h4>
                        <div className="space-y-1 text-slate-600">
                          <p>Room: {formatRoomNumber(selectedRoom)}</p>
                          <p>Capacity: {selectedRoom.capacity} people</p>
                          <p>Floor: {selectedRoom.floor_number}</p>
                          {selectedRoom.features &&
                            selectedRoom.features.length > 0 && (
                              <div className="mt-1">
                                <p className="font-medium text-slate-700">
                                  Features:
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedRoom.features.map(
                                    (feature: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-2 py-0.5 bg-white/60 backdrop-blur-sm text-blue-700 border border-blue-200/50 rounded text-sm"
                                      >
                                        {feature
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase()
                                          )}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Room Layout */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm">
                          {(selectedRoom.capacity || 0) >= 10
                            ? `Select Seats (${selectedSeats.length}/3)`
                            : "Room Layout"}
                        </h4>
                        <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2">
                          <RoomLayout
                            mode={
                              (selectedRoom.capacity || 0) >= 10
                                ? "book"
                                : "view"
                            }
                            capacity={selectedRoom.capacity || 12}
                            roomCode={formatRoomNumber(selectedRoom) || "ROOM"}
                            roomId={selectedRoom.id}
                            selectedSeats={selectedSeats}
                            onSeatClick={
                              (selectedRoom.capacity || 0) >= 10
                                ? handleSeatSelection
                                : undefined
                            }
                            interactive={(selectedRoom.capacity || 0) >= 10}
                            startTime={
                              selectedDate && selectedStartTime
                                ? `${selectedDate}T${selectedStartTime}:00`
                                : undefined
                            }
                            endTime={
                              selectedDate && selectedEndTime
                                ? `${selectedDate}T${selectedEndTime}:00`
                                : undefined
                            }
                          />
                        </div>
                        {(selectedRoom.capacity || 0) >= 10 &&
                          selectedSeats.length > 0 && (
                            <p className="text-sm text-slate-600 mt-1">
                              Selected:{" "}
                              {selectedSeats
                                .map((seat) =>
                                  seat.split("-").slice(1).join("-")
                                )
                                .join(", ")}
                            </p>
                          )}
                        {(selectedRoom.capacity || 0) < 10 && (
                          <div className="mt-2 bg-blue-50/60 backdrop-blur-sm rounded-lg p-2 border border-blue-200/50">
                            <p className="text-blue-800 text-sm">
                              <strong>Small Room:</strong> Entire room reserved
                              for you.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Purpose */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Purpose (Optional)
                        </label>
                        <Textarea
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="Enter purpose..."
                          className="w-full bg-white/40 backdrop-blur-xl border border-white/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-200 text-sm"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Confirm Button */}
            {selectedRoom &&
              selectedDate &&
              selectedStartTime &&
              selectedEndTime && (
                <div className="flex justify-center pt-2 pb-2">
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={
                      !isBookingValid() || isBooking || wouldExceedLimit
                    }
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl"
                  >
                    {isBooking
                      ? "Confirming..."
                      : wouldExceedLimit
                      ? `Limit reached (${
                          userBookingsCount ?? "—"
                        }/${MAX_RESERVATIONS})`
                      : "Confirm Reservation"}
                  </Button>
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
