const { PrismaClient } = require("@prisma/client");

// Initialize Prisma client (simple singleton per process)
const prisma = new PrismaClient();

async function getAllLibraryRooms() {
  return prisma.library_rooms.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      room_number: true,
      capacity: true,
      size_sqft: true,
      features: true,
      description: true,
      floor_number: true,
      is_active: true,
    },
    orderBy: [{ floor_number: "asc" }, { room_number: "asc" }],
  });
}

async function getLibraryRoomById(id) {
  const roomId = Number(id);
  if (!Number.isFinite(roomId)) {
    throw new Error("Invalid room id");
  }
  return prisma.library_rooms.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      room_number: true,
      capacity: true,
      size_sqft: true,
      features: true,
      description: true,
      floor_number: true,
      is_active: true,
      seats: {
        where: {
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
      },
    },
  });
}

module.exports = {
  getAllLibraryRooms,
  getLibraryRoomById,
};

