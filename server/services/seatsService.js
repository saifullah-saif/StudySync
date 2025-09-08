const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getSeatsByRoomId(roomId) {
  const roomIdNum = Number(roomId);
  if (!Number.isFinite(roomIdNum)) {
    throw new Error("Invalid room id");
  }

  return prisma.seats.findMany({
    where: { 
      room_id: roomIdNum,
      is_active: true 
    },
    select: {
      id: true,
      seat_number: true,
      position_x: true,
      position_y: true,
      has_computer: true,
      has_power_outlet: true,
      is_accessible: true,
      is_active: true,
      reservations: {
        where: {
          status: {
            in: ['reserved', 'occupied']
          },
          start_time: {
            lte: new Date()
          },
          end_time: {
            gte: new Date()
          }
        },
        select: {
          id: true,
          status: true,
          start_time: true,
          end_time: true,
          user_id: true
        }
      }
    },
    orderBy: {
      seat_number: 'asc'
    }
  });
}

async function getSeatById(seatId) {
  const seatIdNum = Number(seatId);
  if (!Number.isFinite(seatIdNum)) {
    throw new Error("Invalid seat id");
  }

  return prisma.seats.findUnique({
    where: { id: seatIdNum },
    include: {
      reservations: {
        where: {
          status: {
            in: ['reserved', 'occupied']
          },
          start_time: {
            lte: new Date()
          },
          end_time: {
            gte: new Date()
          }
        }
      }
    }
  });
}

async function createSeatReservation(seatId, userId, startTime, endTime, purpose = null) {
  const seatIdNum = Number(seatId);
  const userIdNum = Number(userId);
  
  if (!Number.isFinite(seatIdNum) || !Number.isFinite(userIdNum)) {
    throw new Error("Invalid seat id or user id");
  }

  // Check if seat exists and is active
  const seat = await prisma.seats.findUnique({
    where: { id: seatIdNum },
    include: {
      library_rooms: true
    }
  });

  if (!seat || !seat.is_active) {
    throw new Error("Seat not found or not active");
  }

  // Check for conflicting reservations
  const conflictingReservation = await prisma.reservations.findFirst({
    where: {
      seat_id: seatIdNum,
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
    throw new Error("Seat is already reserved for the selected time period");
  }

  // Create the reservation
  return prisma.reservations.create({
    data: {
      seat_id: seatIdNum,
      user_id: userIdNum,
      room_id: seat.room_id,
      start_time: startTime,
      end_time: endTime,
      status: 'reserved',
      purpose: purpose
    },
    include: {
      seats: true,
      library_rooms: true
    }
  });
}

async function cancelSeatReservation(reservationId, userId) {
  const reservationIdNum = Number(reservationId);
  const userIdNum = Number(userId);
  
  if (!Number.isFinite(reservationIdNum) || !Number.isFinite(userIdNum)) {
    throw new Error("Invalid reservation id or user id");
  }

  // Check if reservation exists and belongs to user
  const reservation = await prisma.reservations.findUnique({
    where: { id: reservationIdNum }
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.user_id !== userIdNum) {
    throw new Error("You can only cancel your own reservations");
  }

  if (reservation.status === 'occupied') {
    throw new Error("Cannot cancel an occupied seat");
  }

  // Delete the reservation
  return prisma.reservations.delete({
    where: { id: reservationIdNum }
  });
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
      seats: true,
      library_rooms: true
    },
    orderBy: {
      start_time: 'asc'
    }
  });
}

module.exports = {
  getSeatsByRoomId,
  getSeatById,
  createSeatReservation,
  cancelSeatReservation,
  getUserReservations
};
