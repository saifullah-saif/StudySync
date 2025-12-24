"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { BookingModal } from "@/components/booking-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";
import { libraryAPI } from "@/lib/api";
import { toast } from "sonner";

export default function LibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [minCapacity, setMinCapacity] = useState(1);
  const [selectedFeature, setSelectedFeature] = useState("all");

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<
    number | undefined
  >(undefined);
  const [bookingStatusOpen, setBookingStatusOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);

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

  // Cancel reservation
  const cancelReservation = async (reservationId: number) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      const response = await libraryAPI.cancelReservation(reservationId);

      if (response.success) {
        toast.success("Reservation cancelled", {
          description: "Your booking has been removed.",
        });
        await fetchUserBookings();
        await fetchRooms(); // Refresh room availability
      } else {
        toast.error("Cancellation failed", {
          description: response.message || "Failed to cancel reservation.",
        });
      }
    } catch (e: any) {
      console.error("Cancel error:", e);
      toast.error("Cancellation failed", {
        description:
          e.response?.data?.message || "Failed to cancel reservation.",
      });
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

      const matchesCapacity = (room.capacity || 0) >= minCapacity;

      const matchesRoomType =
        roomTypeFilter === "all" ||
        getRoomType(room.name || "") === roomTypeFilter;

      const matchesFacility =
        selectedFeature === "all" ||
        (Array.isArray(room.features) &&
          room.features.includes(selectedFeature));

      return (
        matchesSearch && matchesCapacity && matchesRoomType && matchesFacility
      );
    })
    .sort((a: any, b: any) => {
      if (!a || !b) return 0;

      return formatRoomNumber(a).localeCompare(formatRoomNumber(b));
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all duration-500 overflow-hidden mb-8">
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
          <div className="relative z-10 px-4 sm:px-8 py-8 sm:py-10 md:py-14 text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
              Welcome to the Library Seat &<br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Study Room Reservation System
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
              Find your perfect study space with ease. Browse available rooms,
              check real-time seat availability, and book your slot: all in one
              place.
            </p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-8 bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-3 lg:gap-4">
              {/* Search (larger) */}
              <div className="relative flex items-center w-full lg:flex-1 lg:min-w-[280px] lg:max-w-[520px] h-11 bg-white/40 backdrop-blur-xl border border-white/50 rounded-lg px-3 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-base focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Room Type (dropdown) */}
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 h-11 w-full sm:w-[48%] lg:min-w-[160px] lg:w-auto hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="silent">Silent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Room Features (dropdown) */}
              <Select
                value={selectedFeature}
                onValueChange={setSelectedFeature}
              >
                <SelectTrigger className="bg-white/40 backdrop-blur-xl border border-white/50 h-11 w-full sm:w-[48%] lg:min-w-[170px] lg:w-auto hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                  <SelectValue placeholder="Room Features" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
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

              {/* Capacity (slider 1-12) */}
              <div className="flex items-center gap-3 h-11 w-full lg:min-w-[220px] lg:w-auto bg-white/40 backdrop-blur-xl border border-white/50 rounded-lg px-3 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Capacity
                </span>
                <div className="flex-1">
                  <Slider
                    min={1}
                    max={12}
                    step={1}
                    value={[minCapacity]}
                    onValueChange={(v) => setMinCapacity(v[0] ?? 1)}
                    className="w-full"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900 w-10 text-right">
                  {minCapacity}
                </span>
              </div>

              {/* Booking Status (distinct color) */}
              <Button
                size="sm"
                onClick={() => setBookingStatusOpen(true)}
                className="h-11 px-4 w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-xl transition-all duration-300 whitespace-nowrap"
              >
                Booking Status ({userBookings.length}/5)
              </Button>
            </div>

            {/* Results Count */}
            <div className="mt-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {mounted
                  ? `${filteredAndSortedRooms.length} rooms found`
                  : "Loading..."}
              </span>
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
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedRooms.map((room: any) => (
              <Card
                key={room.id}
                className="group bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] flex flex-col h-full relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/10 before:to-purple-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
              >
                <CardContent className="p-6 flex flex-col h-full relative z-10">
                  {/* Top Section - Basic Info */}
                  <div className="mb-4">
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

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1"></div>

                  {/* Bottom Section - Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 group-hover:scale-105"
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
                      className={`flex-1 transition-all duration-300 ${
                        userBookings.length >= 5
                          ? "text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-xl group-hover:scale-105"
                      }`}
                      disabled={userBookings.length >= 5}
                      onClick={() => {
                        if (userBookings.length >= 5) {
                          toast.error("Booking limit reached", {
                            description:
                              "You have reached the maximum limit of 5 room bookings.",
                          });
                          return;
                        }
                        // Open booking modal with room pre-selected
                        setSelectedRoomForBooking(room.id);
                        setBookingModalOpen(true);
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
          <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl transition-all duration-200 rounded-2xl px-4 sm:px-8 overflow-y-auto">
            <DialogHeader className="pb-4 sm:pb-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 drop-shadow-sm">
                    {selectedRoom?.name}
                  </DialogTitle>
                  <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-mono mt-1">
                    ({selectedRoom ? formatRoomNumber(selectedRoom) : ""}) •
                    Floor {selectedRoom?.floor_number || "N/A"}
                  </p>
                </div>
                <div className="ml-6"></div>
              </div>
            </DialogHeader>

            {selectedRoom ? (
              <div className="space-y-8 relative z-10">
                {/* Room Image */}
                <div className="w-full h-40 sm:h-56 lg:h-64 bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-inner">
                  {selectedRoom?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedRoom.image_url}
                      alt={`${selectedRoom.name || "Room"} cover`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-500 text-lg">No Image</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        Room Details
                      </h3>
                      <div className="space-y-3">
                        <p className="text-slate-700 text-lg">
                          <span className="font-medium">Capacity:</span>{" "}
                          {selectedRoom.capacity} people
                        </p>
                        {selectedRoom.size_sqft && (
                          <p className="text-slate-700 text-lg">
                            <span className="font-medium">Size:</span>{" "}
                            {selectedRoom.size_sqft} sqft
                          </p>
                        )}
                      </div>
                    </div>

                    {Array.isArray(selectedRoom.features) &&
                      selectedRoom.features.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-4">
                            Features
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {selectedRoom.features.map((feature: string) => (
                              <span
                                key={feature}
                                className="px-4 py-2 text-sm bg-white/60 backdrop-blur-sm text-blue-700 border border-blue-200/50 rounded-xl font-medium hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200"
                              >
                                {formatFeatureName(feature)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedRoom.description && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4">
                          Description
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                          {selectedRoom.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      Room Layout
                    </h3>
                    <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-4 max-w-md shadow-inner">
                      <RoomLayout
                        mode="view"
                        capacity={selectedRoom.capacity || 12}
                        roomCode={formatRoomNumber(selectedRoom) || "ROOM"}
                        roomId={selectedRoom.id}
                        interactive={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-600">Loading room details...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking Status Modal */}
        <Dialog open={bookingStatusOpen} onOpenChange={setBookingStatusOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl transition-all duration-200 rounded-2xl px-4 sm:px-6">
            <DialogHeader className="pb-4 relative z-10">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                My Bookings ({userBookings.length}/5)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 relative z-10">
              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">No bookings found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processBookings(userBookings).map((booking: any) => (
                    <div
                      key={`${booking.room_id}-${booking.start_time}`}
                      className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-xl p-4 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {booking.displayType === "seat"
                              ? "Seat Reservation"
                              : "Room Reservation"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {booking.library_rooms?.name || "Unknown Room"} -
                            Room: {booking.library_rooms?.room_number || "N/A"}
                          </p>
                          <p className="text-sm text-slate-600">
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
                              <p className="text-sm text-slate-600">
                                {booking.purpose.split(" - ")[1] ||
                                  booking.purpose}
                              </p>
                            )}
                          {booking.displayType === "room" &&
                            booking.purpose && (
                              <p className="text-sm text-slate-600">
                                Purpose: {booking.purpose}
                              </p>
                            )}
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                              booking.status === "occupied"
                                ? "bg-green-100/60 backdrop-blur-sm text-green-800 border border-green-200/50"
                                : booking.status === "completed"
                                ? "bg-gray-100/60 backdrop-blur-sm text-gray-800 border border-gray-200/50"
                                : "bg-blue-100/60 backdrop-blur-sm text-blue-800 border border-blue-200/50"
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
                          className="text-red-600 border-red-300/50 bg-white/40 backdrop-blur-sm hover:bg-red-50/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200"
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

        {/* Booking Modal */}
        <BookingModal
          open={bookingModalOpen}
          onOpenChangeAction={setBookingModalOpen}
          preSelectedRoomId={selectedRoomForBooking}
          onBookingSuccessAction={() => {
            // Refresh bookings and rooms after successful booking
            fetchUserBookings();
            fetchRooms();
          }}
        />
      </main>
    </div>
  );
}
