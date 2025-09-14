"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomLayout } from "@/components/room-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { libraryAPI } from "@/lib/api";

export default function LibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("room_number");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [selectedFeature, setSelectedFeature] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStatusOpen, setBookingStatusOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  // Booking form state
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  // Helper functions
  const formatFeatureName = (feature: string) => {
    const featureMap: { [key: string]: string } = {
      projector: "Projector",
      whiteboard: "Whiteboard",
      computer: "Computer",
      wifi: "WiFi",
      air_conditioning: "Air Conditioning",
      power_outlets: "Power Outlets",
      tv_screen: "TV Screen",
    };
    return (
      featureMap[feature] || feature.charAt(0).toUpperCase() + feature.slice(1)
    );
  };

  const getRoomType = (name: string) => {
    if (!name) return "other";
    const nameLower = name.toLowerCase();
    if (nameLower.includes("conference")) return "conference";
    if (nameLower.includes("study")) return "study";
    if (nameLower.includes("meeting")) return "meeting";
    if (nameLower.includes("silent")) return "silent";
    return "other";
  };

  const formatRoomNumber = (room: any) => {
    if (!room) return "";
    if (room.floor_number && room.room_number) {
      return `${String(room.floor_number).padStart(2, "0")}${room.room_number}`;
    }
    return room.room_number || "";
  };

  // Generate available dates (next 5 days)
  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  // Generate time slots (9 AM to 8 PM, 30-minute intervals)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 0) break; // Stop at 8:00 PM
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationHours: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationHours * 60;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMins
      .toString()
      .padStart(2, "0")}`;
  };

  // Check if end time exceeds 8 PM
  const isValidEndTime = (startTime: string, durationHours: number) => {
    const endTime = calculateEndTime(startTime, durationHours);
    const [endHours] = endTime.split(":").map(Number);
    return endHours <= 20;
  };

  // Fetch user bookings
  const fetchUserBookings = async () => {
    try {
      const response = await libraryAPI.getUserBookings();
      if (response.success) {
        setUserBookings(response.data);
      }
    } catch (e: any) {
      console.error("Error fetching user bookings", e);
    }
  };

  // Handle seat selection
  const handleSeatSelection = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        // Limit to maximum 3 seats
        if (prev.length >= 3) {
          alert("You can only select up to 3 seats at a time");
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  // Create room reservation
  const createRoomReservation = async () => {
    if (!selectedRoom || !selectedDate || !selectedTime || !duration) {
      alert("Please fill in all fields");
      return;
    }

    const roomCapacity = selectedRoom.capacity || 0;

    // For rooms with capacity < 10, book the entire room (no seat selection needed)
    if (roomCapacity < 10) {
      // Check if room is already booked by checking if any seat is not accessible
      // This indicates the room is occupied
      // We'll handle this in the backend
    } else {
      // For rooms with capacity >= 10, require seat selection
      if (selectedSeats.length === 0) {
        alert("Please select at least one seat");
        return;
      }

      // Limit to maximum 3 seats
      if (selectedSeats.length > 3) {
        alert("You can only book up to 3 seats at a time");
        return;
      }
    }

    const durationNum = parseFloat(duration);
    if (!isValidEndTime(selectedTime, durationNum)) {
      alert("End time cannot exceed 8:00 PM");
      return;
    }

    setIsBooking(true);
    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const endDateTime = new Date(
        startDateTime.getTime() + durationNum * 60 * 60 * 1000
      );

      const response = await libraryAPI.createReservation({
        room_id: selectedRoom.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: purpose || "Room reservation",
        selected_seats: selectedSeats,
        room_capacity: roomCapacity,
      });

      if (response.success) {
        alert("Room booked successfully!");
        setBookingOpen(false);
        // Reset form
        setSelectedDate("");
        setSelectedTime("");
        setDuration("1");
        setPurpose("");
        setSelectedSeats([]);
        await fetchUserBookings();
        await fetchRooms(); // Refresh room availability
      } else {
        alert(response.message || "Failed to book room");
      }
    } catch (e: any) {
      console.error("Booking error:", e);
      alert(
        e.response?.data?.message || "Failed to book room. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  // Cancel reservation
  const cancelReservation = async (reservationId: number) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      const response = await libraryAPI.cancelReservation(reservationId);

      if (response.success) {
        alert("Reservation cancelled successfully!");
        await fetchUserBookings();
        await fetchRooms(); // Refresh room availability
      } else {
        alert(response.message || "Failed to cancel reservation");
      }
    } catch (e: any) {
      console.error("Cancel error:", e);
      alert(e.response?.data?.message || "Failed to cancel reservation");
    }
  };

  // Fetch rooms function
  const fetchRooms = async () => {
    try {
      const response = await libraryAPI.getAllRooms();

      if (response.success) {
        const roomsWithAvailableSeats = await Promise.all(
          response.data.map(async (room: any) => {
            if (room.capacity >= 10) {
              try {
                // Fetch seats for this room to count available ones
                const seatsResponse = await libraryAPI.getRoomSeats(room.id);

                if (seatsResponse.success) {
                  const availableSeats = seatsResponse.data.filter(
                    (seat: any) =>
                      seat.is_active &&
                      (!seat.reservations || seat.reservations.length === 0)
                  ).length;

                  return { ...room, available_seats: availableSeats };
                }
              } catch (error) {
                console.error(
                  `Error fetching seats for room ${room.id}:`,
                  error
                );
              }
            }
            return room;
          })
        );

        setRooms(roomsWithAvailableSeats);
      } else {
        console.error("Failed to load rooms", response);
      }
    } catch (e: any) {
      console.error("Error fetching rooms", e);
    } finally {
      setLoading(false);
    }
  };

  // Process bookings to show individual seat reservations and grouped room reservations
  const processBookings = (bookings: any[]) => {
    const processed: any[] = [];
    const grouped: { [key: string]: any[] } = {};

    bookings.forEach((booking) => {
      // Check if this is a seat reservation (has seat_id and purpose contains "Seat")
      const isSeatReservation =
        booking.seat_id && booking.purpose?.includes("Seat");

      if (isSeatReservation) {
        // For seat reservations, show each one individually
        processed.push({
          ...booking,
          displayType: "seat",
          reservationIds: [booking.id],
        });
      } else {
        // For room reservations, group by room and time
        const key = `${booking.room_id}-${booking.start_time}-${booking.end_time}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(booking);
      }
    });

    // Add grouped room reservations
    Object.values(grouped).forEach((group) => {
      const firstBooking = group[0];
      processed.push({
        ...firstBooking,
        displayType: "room",
        reservationIds: group.map((b) => b.id),
      });
    });

    // Sort by start time
    return processed.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  };

  useEffect(() => {
    setMounted(true);
    fetchRooms();
    fetchUserBookings();
  }, []);

  const filteredAndSortedRooms = rooms
    .filter((room: any) => {
      if (!room) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (room.name && room.name.toLowerCase().includes(q)) ||
        (room.room_number &&
          String(room.room_number).toLowerCase().includes(q)) ||
        formatRoomNumber(room).toLowerCase().includes(q);

      const matchesFloor =
        floorFilter === "all" ||
        (room.floor_number != null &&
          String(room.floor_number) === floorFilter);

      const matchesCapacity =
        capacityFilter === "all" ||
        (capacityFilter === "1-4" &&
          (room.capacity || 0) >= 1 &&
          (room.capacity || 0) <= 4) ||
        (capacityFilter === "5-8" &&
          (room.capacity || 0) >= 5 &&
          (room.capacity || 0) <= 8) ||
        (capacityFilter === "9-12" &&
          (room.capacity || 0) >= 9 &&
          (room.capacity || 0) <= 12);

      const matchesRoomType =
        roomTypeFilter === "all" ||
        getRoomType(room.name || "") === roomTypeFilter;

      const matchesFacility =
        selectedFeature === "all" ||
        (Array.isArray(room.features) &&
          room.features.includes(selectedFeature));

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "occupied" && room.is_active === true) ||
        (availabilityFilter === "available" && room.is_active === false);

      return (
        matchesSearch &&
        matchesFloor &&
        matchesCapacity &&
        matchesRoomType &&
        matchesFacility &&
        matchesAvailability
      );
    })
    .sort((a: any, b: any) => {
      if (!a || !b) return 0;

      switch (sortBy) {
        case "room_number":
          return formatRoomNumber(a).localeCompare(formatRoomNumber(b));
        case "floor":
          return (a.floor_number || 0) - (b.floor_number || 0);
        case "capacity":
          return (b.capacity || 0) - (a.capacity || 0);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "room_type":
          return getRoomType(a.name || "").localeCompare(
            getRoomType(b.name || "")
          );
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden mb-8">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://bracuexpress.com/wp-content/uploads/2024/07/Screenshot_20240715_151414_Maps-800x445.jpg')`,
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 px-8 py-16 md:py-24 text-center text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Welcome to the Library Seat &<br />
              Study Room Reservation System
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-4xl mx-auto leading-relaxed">
              Find your perfect study space with ease. Browse available rooms,
              check real-time seat availability, and book your slot: all in one
              place.
            </p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-8 bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {/* Search */}
              <Select
                value={searchQuery ? "custom" : "all"}
                onValueChange={() => {}}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <div className="flex items-center w-full">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <Input
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:outline-none"
                    />
                  </div>
                </SelectTrigger>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="room_number">Room Number</SelectItem>
                  <SelectItem value="floor">Floor</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="room_type">Room Type</SelectItem>
                </SelectContent>
              </Select>

              {/* Floor Filter */}
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="8">Floor 8</SelectItem>
                  <SelectItem value="9">Floor 9</SelectItem>
                </SelectContent>
              </Select>

              {/* Room Type */}
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="silent">Silent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Availability Filter */}
              <Select
                value={availabilityFilter}
                onValueChange={setAvailabilityFilter}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                </SelectContent>
              </Select>

              {/* Capacity Filter */}
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Capacity" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Capacities</SelectItem>
                  <SelectItem value="1-4">1-4 People</SelectItem>
                  <SelectItem value="5-8">5-8 People</SelectItem>
                  <SelectItem value="9-12">9-12 People</SelectItem>
                </SelectContent>
              </Select>

              {/* Features Dropdown */}
              <Select
                value={selectedFeature}
                onValueChange={setSelectedFeature}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-10">
                  <SelectValue placeholder="Features" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="wifi">WiFi</SelectItem>
                  <SelectItem value="projector">Projector</SelectItem>
                  <SelectItem value="air_conditioning">
                    Air Conditioning
                  </SelectItem>
                  <SelectItem value="whiteboard">Whiteboard</SelectItem>
                  <SelectItem value="computer">Computer</SelectItem>
                  <SelectItem value="power_outlets">Power Outlets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count and Booking Status */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {mounted
                  ? `${filteredAndSortedRooms.length} rooms found`
                  : "Loading..."}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookingStatusOpen(true)}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Booking Status ({userBookings.length}/5)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Room Listing */}
        {!mounted || loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400">Loading rooms...</p>
          </div>
        ) : filteredAndSortedRooms.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400">
              No rooms found.{" "}
              {rooms.length > 0
                ? "Try adjusting your filters."
                : "No rooms available."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedRooms.map((room: any) => (
              <Card
                key={room.id}
                className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Top Section - Image and Basic Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      Room Image
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {room.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mb-1">
                        ({formatRoomNumber(room)})
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Capacity: {room.capacity || 0}
                      </p>
                    </div>
                  </div>

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1"></div>

                  {/* Bottom Section - Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={async () => {
                        try {
                          const res = await libraryAPI.getRoomDetails(room.id);
                          if (res.success) {
                            setSelectedRoom(res.data);
                            setDetailsOpen(true);
                          }
                        } catch (e) {
                          console.error("Failed to load room details", e);
                        }
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${
                        userBookings.length >= 5
                          ? "text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                          : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      disabled={userBookings.length >= 5}
                      onClick={() => {
                        if (userBookings.length >= 5) {
                          alert(
                            "You have reached the maximum limit of 5 room bookings."
                          );
                          return;
                        }
                        // Redirect to booking page with room pre-selected
                        router.push(`/booking?roomId=${room.id}`);
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-7xl max-h-[95vh] bg-white dark:bg-gray-800 transition-all duration-200 rounded-2xl px-8">
            <DialogHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                    {selectedRoom?.name}
                  </DialogTitle>
                  <p className="text-xl text-gray-600 dark:text-gray-400 font-mono mt-1">
                    ({selectedRoom ? formatRoomNumber(selectedRoom) : ""}) •
                    Floor {selectedRoom?.floor_number || "N/A"}
                  </p>
                </div>
                <div className="ml-6"></div>
              </div>
            </DialogHeader>

            {selectedRoom ? (
              <div className="space-y-8">
                {/* Room Image */}
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-lg">
                    Placeholder Image
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Room Details
                      </h3>
                      <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300 text-lg">
                          <span className="font-medium">Capacity:</span>{" "}
                          {selectedRoom.capacity} people
                        </p>
                        {selectedRoom.size_sqft && (
                          <p className="text-gray-700 dark:text-gray-300 text-lg">
                            <span className="font-medium">Size:</span>{" "}
                            {selectedRoom.size_sqft} sqft
                          </p>
                        )}
                      </div>
                    </div>

                    {Array.isArray(selectedRoom.features) &&
                      selectedRoom.features.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Features
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {selectedRoom.features.map((feature: string) => (
                              <span
                                key={feature}
                                className="px-4 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-xl font-medium"
                              >
                                {formatFeatureName(feature)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedRoom.description && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Description
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                          {selectedRoom.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Room Layout
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 max-w-md">
                      <RoomLayout
                        mode="view"
                        capacity={selectedRoom.capacity || 12}
                        roomCode={formatRoomNumber(selectedRoom) || "ROOM"}
                        roomId={selectedRoom.id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-600 dark:text-gray-300">
                  Loading room details...
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking Modal */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="sm:max-w-6xl max-h-[95vh] bg-white dark:bg-gray-800 transition-all duration-200 rounded-2xl overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Book Room: {selectedRoom?.name}
              </DialogTitle>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-mono">
                ({selectedRoom ? formatRoomNumber(selectedRoom) : ""}) • Floor{" "}
                {selectedRoom?.floor_number || "N/A"}
              </p>
            </DialogHeader>

            {selectedRoom && (
              <div
                className={`grid gap-8 ${
                  (selectedRoom.capacity || 0) >= 10
                    ? "md:grid-cols-2"
                    : "md:grid-cols-1"
                }`}
              >
                {/* Left Column - Room Layout (only for rooms with capacity >= 10) */}
                {(selectedRoom.capacity || 0) >= 10 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Select Seats
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                      <RoomLayout
                        mode="book"
                        capacity={selectedRoom.capacity || 12}
                        roomCode={formatRoomNumber(selectedRoom) || "ROOM"}
                        roomId={selectedRoom.id}
                        selectedSeats={selectedSeats}
                        onSeatClick={handleSeatSelection}
                      />
                    </div>

                    {/* Selected Seats Display */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected seats ({selectedSeats.length}/3):
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 min-h-[50px] flex flex-wrap gap-2">
                        {selectedSeats.length > 0 ? (
                          selectedSeats.map((seat) => (
                            <span
                              key={seat}
                              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                            >
                              Seat {seat.split("-")[1]}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            No seats selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Room info for small rooms */}
                {(selectedRoom.capacity || 0) < 10 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Small Room Booking
                      </h3>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        This room has a capacity of {selectedRoom.capacity}{" "}
                        people. When you book this room, the entire room will be
                        reserved for your use during the selected time period.
                      </p>
                    </div>
                  </div>
                )}

                {/* Right Column - Booking Form */}
                <div className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Date
                    </label>
                    <Select
                      value={selectedDate}
                      onValueChange={setSelectedDate}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Choose a date" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700">
                        {getAvailableDates().map((date) => (
                          <SelectItem key={date} value={date}>
                            {new Date(date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Time
                    </label>
                    <Select
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Choose a time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 max-h-60">
                        {getTimeSlots().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (hours)
                    </label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Choose duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700">
                        <SelectItem value="0.5">30 minutes</SelectItem>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="1.5">1.5 hours</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="2.5">2.5 hours</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Purpose Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purpose (optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Study session, meeting, etc."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  {/* End Time Display */}
                  {selectedTime && duration && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">End Time:</span>{" "}
                        {calculateEndTime(selectedTime, parseFloat(duration))}
                      </p>
                      {!isValidEndTime(selectedTime, parseFloat(duration)) && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          ⚠️ End time exceeds 8:00 PM. Please choose a shorter
                          duration or earlier start time.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setBookingOpen(false);
                        // Reset form when closing
                        setSelectedDate("");
                        setSelectedTime("");
                        setDuration("1");
                        setPurpose("");
                        setSelectedSeats([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createRoomReservation}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      disabled={
                        isBooking ||
                        !selectedDate ||
                        !selectedTime ||
                        !duration ||
                        ((selectedRoom?.capacity || 0) >= 10 &&
                          selectedSeats.length === 0) ||
                        !isValidEndTime(selectedTime, parseFloat(duration))
                      }
                    >
                      {isBooking ? "Booking..." : "Confirm Booking"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking Status Modal */}
        <Dialog open={bookingStatusOpen} onOpenChange={setBookingStatusOpen}>
          <DialogContent className="sm:max-w-4xl bg-white dark:bg-gray-800 transition-all duration-200 rounded-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                My Bookings ({userBookings.length}/5)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No bookings found.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processBookings(userBookings).map((booking: any) => (
                    <div
                      key={`${booking.room_id}-${booking.start_time}`}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {booking.displayType === "seat"
                              ? "Seat Reservation"
                              : "Room Reservation"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.library_rooms?.name || "Unknown Room"} -
                            Room: {booking.library_rooms?.room_number || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(booking.start_time).toLocaleDateString()}{" "}
                            •{" "}
                            {new Date(booking.start_time).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}{" "}
                            -{" "}
                            {new Date(booking.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {booking.displayType === "seat" &&
                            booking.purpose && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {booking.purpose.split(" - ")[1] ||
                                  booking.purpose}
                              </p>
                            )}
                          {booking.displayType === "room" &&
                            booking.purpose && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Purpose: {booking.purpose}
                              </p>
                            )}
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                              booking.status === "occupied"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : booking.status === "completed"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {booking.status === "occupied"
                              ? "Active"
                              : booking.status || "Reserved"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900"
                          onClick={() => {
                            // Cancel all reservations in this group
                            booking.reservationIds.forEach((id: number) =>
                              cancelReservation(id)
                            );
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
