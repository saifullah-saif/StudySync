const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createRoomReservation(roomId, userId, startTime, endTime, purpose = null, selectedSeats = [], roomCapacity = 0) {
  const roomIdNum = Number(roomId);
  const userIdNum = Number(userId);

  if (!Number.isFinite(roomIdNum) || !Number.isFinite(userIdNum)) {
    throw new Error("Invalid room id or user id");
  }

  // Check if room exists
  const room = await prisma.library_rooms.findUnique({
    where: { id: roomIdNum },
    include: {
      seats: {
        where: { is_active: true }
      }
    }
  });

  if (!room) {
    throw new Error("Room not found");
  }

  // For rooms with capacity < 10, check if any seat is not accessible (room is occupied)
  if (roomCapacity < 10) {
    const occupiedSeats = room.seats.filter(seat => !seat.is_accessible);
    if (occupiedSeats.length > 0) {
      throw new Error("Room is currently occupied");
    }
  }

  // Check for conflicting reservations
  const conflictingReservation = await prisma.reservations.findFirst({
    where: {
      room_id: roomIdNum,
      status: {
        in: ['reserved', 'occupied']
      },
      OR: [
        {
          start_time: {
            lte: startTime
          },
          end_time: {
            gt: startTime
          }
        },
        {
          start_time: {
            lt: endTime
          },
          end_time: {
            gte: endTime
          }
        },
        {
          start_time: {
            gte: startTime
          },
          end_time: {
            lte: endTime
          }
        }
      ]
    }
  });

  if (conflictingReservation) {
    throw new Error("Room is already reserved for the selected time period");
  }

  // Check if user has conflicting reservations (can't book multiple rooms at same time)
  const userConflictingReservation = await prisma.reservations.findFirst({
    where: {
      user_id: userIdNum,
      status: {
        in: ['reserved', 'occupied']
      },
      OR: [
        {
          start_time: {
            lte: startTime
          },
          end_time: {
            gt: startTime
          }
        },
        {
          start_time: {
            lt: endTime
          },
          end_time: {
            gte: endTime
          }
        },
        {
          start_time: {
            gte: startTime
          },
          end_time: {
            lte: endTime
          }
        }
      ]
    }
  });

  if (userConflictingReservation) {
    throw new Error("You already have a reservation during this time period");
  }

  // Check if user has reached the maximum limit of 5 active reservations
  const userActiveReservations = await prisma.reservations.count({
    where: {
      user_id: userIdNum,
      status: {
        in: ['reserved', 'occupied']
      },
      end_time: {
        gte: new Date()
      }
    }
  });

  if (userActiveReservations >= 5) {
    throw new Error("You have reached the maximum limit of 5 active reservations");
  }

  // Create reservations based on room type
  console.log(`Room capacity: ${roomCapacity}, Selected seats: ${selectedSeats.length}`);

        if (roomCapacity < 10) {
        // For small rooms, create one reservation for the entire room
        const reservation = await prisma.reservations.create({
          data: {
            room_id: roomIdNum,
            user_id: userIdNum,
            start_time: startTime,
            end_time: endTime,
            status: 'reserved',
            purpose: purpose || 'Room reservation'
          },
          include: {
            library_rooms: true
          }
        });

        // Make all seats in the room inaccessible
        await prisma.seats.updateMany({
          where: { room_id: roomIdNum },
          data: { is_accessible: false }
        });

        return [reservation];
      } else {
    // For large rooms, limit to maximum 3 seats per booking
    if (selectedSeats.length > 3) {
      throw new Error('You can only book up to 3 seats at a time');
    }

    const reservations = [];

    // Create separate reservations for each selected seat
    for (const seatNumber of selectedSeats) {
      console.log(`Processing seat: ${seatNumber} for room ${roomIdNum}`);

      // Find the actual seat in the database using the seat number directly
      const seat = await prisma.seats.findFirst({
        where: {
          room_id: roomIdNum,
          seat_number: seatNumber
        }
      });

      if (!seat) {
        console.error(`Seat lookup failed for seatNumber: ${seatNumber}, roomId: ${roomIdNum}`);

        // Try to find all seats in this room for debugging
        const allSeats = await prisma.seats.findMany({
          where: { room_id: roomIdNum },
          select: { id: true, seat_number: true }
        });
        console.error(`Available seats in room ${roomIdNum}:`, allSeats);

        throw new Error(`Seat ${seatNumber} not found in room ${roomIdNum}`);
      }

      console.log(`Found seat in database:`, seat);

      // Check if seat is already booked by looking for active reservations
      const existingReservation = await prisma.reservations.findFirst({
        where: {
          seat_id: seat.id,
          status: {
            in: ['reserved', 'occupied']
          },
          OR: [
            {
              start_time: {
                lte: startTime
              },
              end_time: {
                gt: startTime
              }
            },
            {
              start_time: {
                lt: endTime
              },
              end_time: {
                gte: endTime
              }
            },
            {
              start_time: {
                gte: startTime
              },
              end_time: {
                lte: endTime
              }
            }
          ]
        }
      });

      if (existingReservation) {
        throw new Error(`Seat ${seatNumber} is already booked for the selected time period`);
      }

      // Create reservation for this seat (store seat info in purpose and seat_id)
      const reservation = await prisma.reservations.create({
        data: {
          room_id: roomIdNum,
          user_id: userIdNum,
          seat_id: seat.id,
          start_time: startTime,
          end_time: endTime,
          status: 'reserved',
          purpose: `${purpose || 'Seat reservation'} - Seat ${seatNumber}`
        },
        include: {
          library_rooms: true
        }
      });

      // Make this specific seat inaccessible
      await prisma.seats.update({
        where: { id: seat.id },
        data: { is_accessible: false }
      });

      reservations.push(reservation);
    }

    return reservations;
  }
}

async function getUserReservations(userId) {
  const userIdNum = Number(userId);
  if (!Number.isFinite(userIdNum)) {
    throw new Error("Invalid user id");
  }

  return prisma.reservations.findMany({
    where: { 
      user_id: userIdNum,
      end_time: {
        gte: new Date()
      }
    },
    include: {
      library_rooms: {
        select: {
          id: true,
          name: true,
          room_number: true,
          floor_number: true
        }
      }
    },
    orderBy: {
      start_time: 'asc'
    }
  });
}

async function cancelReservation(reservationId, userId) {
  const reservationIdNum = Number(reservationId);
  const userIdNum = Number(userId);
  
  if (!Number.isFinite(reservationIdNum) || !Number.isFinite(userIdNum)) {
    throw new Error("Invalid reservation id or user id");
  }

  // Check if reservation exists and belongs to user
  const reservation = await prisma.reservations.findUnique({
    where: { id: reservationIdNum },
    include: {
      library_rooms: true
    }
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.user_id !== userIdNum) {
    throw new Error("You can only cancel your own reservations");
  }

  // Delete the reservation and make seat/room available
  const result = await prisma.$transaction(async (tx) => {
    // Delete reservation
    await tx.reservations.delete({
      where: { id: reservationIdNum }
    });

    // Get room info to determine capacity
    const room = await tx.library_rooms.findUnique({
      where: { id: reservation.room_id }
    });

    if (room && room.capacity < 10) {
      // For small rooms, check if there are any other active reservations
      const activeReservations = await tx.reservations.findMany({
        where: {
          room_id: reservation.room_id,
          status: {
            in: ['reserved', 'occupied']
          },
          end_time: {
            gt: new Date()
          }
        }
      });

      // If no active reservations, make all seats accessible
      if (activeReservations.length === 0) {
        await tx.seats.updateMany({
          where: { room_id: reservation.room_id },
          data: { is_accessible: true }
        });
      }
    } else {
      // For large rooms, handle seat-based availability
      // Extract seat number from purpose if it's a seat reservation
      const seatMatch = reservation.purpose?.match(/Seat (\d+)/);
      if (seatMatch) {
        const seatNumber = seatMatch[1];

        // Check if this specific seat has any other active reservations
        const activeSeatReservations = await tx.reservations.findMany({
          where: {
            room_id: reservation.room_id,
            status: {
              in: ['reserved', 'occupied']
            },
            end_time: {
              gt: new Date()
            },
            purpose: {
              contains: `Seat ${seatNumber}`
            }
          }
        });

        // If no active reservations for this seat, make it accessible
        if (activeSeatReservations.length === 0) {
          await tx.seats.updateMany({
            where: {
              room_id: reservation.room_id,
              seat_number: seatNumber
            },
            data: { is_accessible: true }
          });
        }
      }
    }

    return true;
  });

  return result;
}

// Function to automatically update room availability based on time
async function updateRoomAvailability() {
  const now = new Date();

  // Find all reservations that have ended
  const endedReservations = await prisma.reservations.findMany({
    where: {
      end_time: {
        lte: now
      },
      status: {
        in: ['reserved', 'occupied']
      }
    },
    include: {
      library_rooms: true
    }
  });

  // Group ended reservations by room to handle seat availability
  const roomReservations = {};
  for (const reservation of endedReservations) {
    if (!roomReservations[reservation.room_id]) {
      roomReservations[reservation.room_id] = [];
    }
    roomReservations[reservation.room_id].push(reservation);
  }

  // Update room availability and reservation status
  for (const [roomId, reservations] of Object.entries(roomReservations)) {
    await prisma.$transaction(async (tx) => {
      // Update all ended reservations to completed
      for (const reservation of reservations) {
        await tx.reservations.update({
          where: { id: reservation.id },
          data: { status: 'completed' }
        });
      }

      // Get room info to determine capacity
      const room = await tx.library_rooms.findUnique({
        where: { id: parseInt(roomId) }
      });

      if (room && room.capacity < 10) {
        // For small rooms, check if there are any other active reservations
        const activeReservations = await tx.reservations.findMany({
          where: {
            room_id: parseInt(roomId),
            status: {
              in: ['reserved', 'occupied']
            },
            start_time: {
              lte: now
            },
            end_time: {
              gt: now
            }
          }
        });

        // If no active reservations, make all seats accessible
        if (activeReservations.length === 0) {
          await tx.seats.updateMany({
            where: { room_id: parseInt(roomId) },
            data: { is_accessible: true }
          });
        }
      } else {
        // For large rooms, handle seat-based availability
        // Find seats that should be freed based on ended reservations
        for (const reservation of reservations) {
          // Extract seat number from purpose if it's a seat reservation
          const seatMatch = reservation.purpose?.match(/Seat (\d+)/);
          if (seatMatch) {
            const seatNumber = seatMatch[1];

            // Check if this specific seat has any other active reservations
            const activeSeatReservations = await tx.reservations.findMany({
              where: {
                room_id: parseInt(roomId),
                status: {
                  in: ['reserved', 'occupied']
                },
                start_time: {
                  lte: now
                },
                end_time: {
                  gt: now
                },
                purpose: {
                  contains: `Seat ${seatNumber}`
                }
              }
            });

            // If no active reservations for this seat, make it accessible
            if (activeSeatReservations.length === 0) {
              await tx.seats.updateMany({
                where: {
                  room_id: parseInt(roomId),
                  seat_number: seatNumber
                },
                data: { is_accessible: true }
              });
            }
          }
        }
      }
    });
  }

  // Find reservations that should be occupied now
  const shouldBeOccupiedReservations = await prisma.reservations.findMany({
    where: {
      start_time: {
        lte: now
      },
      end_time: {
        gt: now
      },
      status: 'reserved'
    }
  });

  // Update their status to occupied
  for (const reservation of shouldBeOccupiedReservations) {
    await prisma.reservations.update({
      where: { id: reservation.id },
      data: { status: 'occupied' }
    });
  }

  return {
    endedReservations: endedReservations.length,
    activatedReservations: shouldBeOccupiedReservations.length
  };
}

async function checkRoomAvailability(roomId, startTime, endTime) {
  // Get room information to determine capacity
  const room = await prisma.library_rooms.findUnique({
    where: { id: roomId },
    select: { capacity: true }
  });

  if (!room) {
    return false; // Room doesn't exist
  }

  const overlappingReservations = await prisma.reservations.findMany({
    where: {
      room_id: roomId,
      status: {
        in: ['reserved', 'occupied']
      },
      OR: [
        {
          start_time: {
            lte: startTime
          },
          end_time: {
            gt: startTime
          }
        },
        {
          start_time: {
            lt: endTime
          },
          end_time: {
            gte: endTime
          }
        },
        {
          start_time: {
            gte: startTime
          },
          end_time: {
            lte: endTime
          }
        }
      ]
    }
  });

  // For small rooms (capacity < 10), any reservation makes it unavailable
  if (room.capacity < 10) {
    return overlappingReservations.length === 0;
  }

  // For large rooms (capacity >= 10), check if all seats are booked
  const seatReservations = overlappingReservations.filter(res => res.seat_id !== null);
  const roomReservations = overlappingReservations.filter(res => res.seat_id === null);

  // If there's a room-level reservation (entire room booked), it's unavailable
  if (roomReservations.length > 0) {
    return false;
  }

  // Get total number of seats in the room
  const totalSeats = await prisma.seats.count({
    where: {
      room_id: roomId,
      is_active: true
    }
  });

  // Room is available if not all seats are booked
  return seatReservations.length < totalSeats;
}

module.exports = {
  createRoomReservation,
  getUserReservations,
  cancelReservation,
  updateRoomAvailability,
  checkRoomAvailability
};
