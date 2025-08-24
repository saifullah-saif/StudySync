const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class BuddyService {
  static instance = null;

  static getInstance() {
    if (!BuddyService.instance) {
      BuddyService.instance = new BuddyService();
    }
    return BuddyService.instance;
  }

  // Get peers - users who share current courses (is_completed = false)
  async getPeers(userId, searchQuery = '') {
    try {
      // Get current user's current courses
      const userCurrentCourses = await prisma.user_courses.findMany({
        where: {
          user_id: userId,
          is_completed: false,
        },
        select: {
          course_id: true,
        },
      });

      if (userCurrentCourses.length === 0) {
        return [];
      }

      const userCourseIds = userCurrentCourses.map(uc => uc.course_id);

      // Build search conditions for users and courses (prefix matching)
      const searchConditions = [];
      if (searchQuery && searchQuery.trim()) {
        const trimmedQuery = searchQuery.trim();
        searchConditions.push(
          {
            users: {
              name: {
                startsWith: trimmedQuery,
                mode: 'insensitive'
              }
            }
          },
          {
            courses: {
              course_code: {
                startsWith: trimmedQuery,
                mode: 'insensitive'
              }
            }
          },
          {
            courses: {
              course_name: {
                startsWith: trimmedQuery,
                mode: 'insensitive'
              }
            }
          }
        );
      }

      // Find other users who have the same current courses
      const peersData = await prisma.user_courses.findMany({
        where: {
          AND: [
            {
              course_id: {
                in: userCourseIds,
              },
            },
            {
              is_completed: false,
            },
            {
              user_id: {
                not: userId, // Exclude current user
              },
            },
            // Add search conditions if provided
            ...(searchConditions.length > 0 ? [{ OR: searchConditions }] : [])
          ]
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              semester: true,
              profile_picture_url: true,
            },
          },
          courses: {
            select: {
              course_code: true,
              course_name: true,
            },
          },
        },
      });

      // Group by user and collect shared courses
      const peersMap = new Map();
      
      peersData.forEach(record => {
        const userId = record.users.id;
        if (!peersMap.has(userId)) {
          peersMap.set(userId, {
            ...record.users,
            sharedCourses: [],
            type: 'peer',
          });
        }
        peersMap.get(userId).sharedCourses.push({
          code: record.courses.course_code,
          name: record.courses.course_name,
        });
      });

      return Array.from(peersMap.values());
    } catch (error) {
      console.error("Get peers error:", error);
      throw error;
    }
  }

  // Get mentors - users who have completed courses that current user is taking
  async getMentors(userId, searchQuery = '') {
    try {
      // Get current user's current courses (what they're learning now)
      const userCurrentCourses = await prisma.user_courses.findMany({
        where: {
          user_id: userId,
          is_completed: false,
        },
        select: {
          course_id: true,
        },
      });

      if (userCurrentCourses.length === 0) {
        return [];
      }

      const userCourseIds = userCurrentCourses.map(uc => uc.course_id);

      // Build search conditions for users and courses (prefix matching)
      const searchConditions = [];
      if (searchQuery && searchQuery.trim()) {
        const trimmedQuery = searchQuery.trim();
        searchConditions.push(
          {
            users: {
              name: {
                startsWith: trimmedQuery,
                mode: 'insensitive'
              }
            }
          },
          {
            courses: {
              course_code: {
                startsWith: trimmedQuery,
                mode: 'insensitive'
              }
            }
          },
          {
            courses: {
              course_name: {
                startsWith: trimmedQuery,
                mode: 'insensitive'
              }
            }
          }
        );
      }

      // Find users who have completed these courses (potential mentors)
      const mentorsData = await prisma.user_courses.findMany({
        where: {
          AND: [
            {
              course_id: {
                in: userCourseIds,
              },
            },
            {
              is_completed: true, // They have completed the course
            },
            {
              user_id: {
                not: userId, // Exclude current user
              },
            },
            // Add search conditions if provided
            ...(searchConditions.length > 0 ? [{ OR: searchConditions }] : [])
          ]
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              semester: true,
              profile_picture_url: true,
            },
          },
          courses: {
            select: {
              course_code: true,
              course_name: true,
            },
          },
        },
      });

      // Group by user and collect courses they can help with
      const mentorsMap = new Map();
      
      mentorsData.forEach(record => {
        const userId = record.users.id;
        if (!mentorsMap.has(userId)) {
          mentorsMap.set(userId, {
            ...record.users,
            sharedCourses: [],
            type: 'mentor',
          });
        }
        mentorsMap.get(userId).sharedCourses.push({
          code: record.courses.course_code,
          name: record.courses.course_name,
        });
      });

      return Array.from(mentorsMap.values());
    } catch (error) {
      console.error("Get mentors error:", error);
      throw error;
    }
  }

  // Get buddies based on type (peers or mentors)
  async getBuddies(userId, type = 'peers', searchQuery = '') {
    try {
      let buddies;
      if (type === 'mentors') {
        buddies = await this.getMentors(userId, searchQuery);
      } else {
        buddies = await this.getPeers(userId, searchQuery);
      }

      // Get all connection statuses for these users
      const buddyIds = buddies.map(buddy => buddy.id);
      
      if (buddyIds.length === 0) {
        return buddies;
      }

      // Query for existing connections (bidirectional check)
      const connections = await prisma.user_connections.findMany({
        where: {
          OR: [
            {
              requester_id: userId,
              addressee_id: { in: buddyIds }
            },
            {
              requester_id: { in: buddyIds },
              addressee_id: userId
            }
          ]
        },
        select: {
          requester_id: true,
          addressee_id: true,
          status: true,
          request_type: true
        }
      });

      // Create a map of connection statuses
      const connectionMap = new Map();
      connections.forEach(conn => {
        const otherUserId = conn.requester_id === userId ? conn.addressee_id : conn.requester_id;
        connectionMap.set(otherUserId, {
          status: conn.status,
          request_type: conn.request_type,
          is_requester: conn.requester_id === userId
        });
      });

      // Add connection status to each buddy
      const buddiesWithStatus = buddies.map(buddy => {
        const connectionInfo = connectionMap.get(buddy.id);
        return {
          ...buddy,
          connection_status: connectionInfo?.status || null,
          connection_type: connectionInfo?.request_type || null,
          is_requester: connectionInfo?.is_requester || false,
          is_connected: connectionInfo?.status === 'accepted',
          has_pending_request: connectionInfo?.status === 'pending'
        };
      });

      return buddiesWithStatus;
    } catch (error) {
      console.error("Get buddies error:", error);
      throw error;
    }
  }

  // Create a new connection request (peer or mentor)
  async createConnection(requesterId, addresseeId, requestType) {
    try {
      // Validate input parameters
      if (!requesterId || !addresseeId || !requestType) {
        throw new Error("Missing required parameters: requesterId, addresseeId, or requestType");
      }

      if (!['peer', 'mentor'].includes(requestType)) {
        throw new Error("Invalid request type. Must be 'peer' or 'mentor'");
      }

      if (requesterId === addresseeId) {
        throw new Error("Cannot send connection request to yourself");
      }

      // Check if both users exist
      const [requester, addressee] = await Promise.all([
        prisma.users.findUnique({ where: { id: requesterId } }),
        prisma.users.findUnique({ where: { id: addresseeId } })
      ]);

      if (!requester) {
        throw new Error("Requester user not found");
      }

      if (!addressee) {
        throw new Error("Addressee user not found");
      }

      // Check if a connection request already exists between these users
      const existingConnection = await prisma.user_connections.findFirst({
        where: {
          OR: [
            {
              requester_id: requesterId,
              addressee_id: addresseeId,
            },
            {
              requester_id: addresseeId,
              addressee_id: requesterId,
            }
          ]
        }
      });

      if (existingConnection) {
        throw new Error("A connection request already exists between these users");
      }

      // Create the connection request with correct enum values
      const connection = await prisma.user_connections.create({
        data: {
          request_type: requestType, // Direct use: 'peer' or 'mentor'
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: "pending",
          created_at: new Date(),
        },
        include: {
          users_user_connections_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          users_user_connections_addressee_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return {
        id: connection.id,
        request_type: connection.request_type,
        status: connection.status,
        created_at: connection.created_at,
        requester: connection.users_user_connections_requester_idTousers,
        addressee: connection.users_user_connections_addressee_idTousers,
      };
    } catch (error) {
      console.error("Create connection error:", error);
      throw error;
    }
  }

  // Get pending connection requests for a user
  async getPendingConnections(userId) {
    try {
      const connections = await prisma.user_connections.findMany({
        where: {
          addressee_id: userId,
          status: "pending",
        },
        include: {
          users_user_connections_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              semester: true,
              profile_picture_url: true,
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return connections.map(conn => ({
        id: conn.id,
        request_type: conn.request_type,
        status: conn.status,
        created_at: conn.created_at,
        requester: conn.users_user_connections_requester_idTousers,
      }));
    } catch (error) {
      console.error("Get pending connections error:", error);
      throw error;
    }
  }

  // Get pending invitations for a user (alias for getPendingConnections for clarity)
  async getPendingInvitations(userId) {
    try {
      return await this.getPendingConnections(userId);
    } catch (error) {
      console.error("Get pending invitations error:", error);
      throw error;
    }
  }

  // Respond to an invitation (accept or reject)
  async respondToInvitation(invitationId, response, userId) {
    try {
      if (!['accepted', 'rejected'].includes(response)) {
        throw new Error("Invalid response. Must be 'accepted' or 'rejected'");
      }

      // Verify the invitation exists and the user is the addressee
      const invitation = await prisma.user_connections.findFirst({
        where: {
          id: invitationId,
          addressee_id: userId,
          status: "pending",
        },
        include: {
          users_user_connections_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      if (!invitation) {
        throw new Error("Invitation not found or not authorized to respond");
      }

      // Update the invitation status
      const updatedInvitation = await prisma.user_connections.update({
        where: { id: invitationId },
        data: { 
          status: response,
          updated_at: new Date()
        },
        include: {
          users_user_connections_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          users_user_connections_addressee_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return {
        id: updatedInvitation.id,
        request_type: updatedInvitation.request_type,
        status: updatedInvitation.status,
        created_at: updatedInvitation.created_at,
        updated_at: updatedInvitation.updated_at,
        requester: updatedInvitation.users_user_connections_requester_idTousers,
        addressee: updatedInvitation.users_user_connections_addressee_idTousers,
      };
    } catch (error) {
      console.error("Respond to invitation error:", error);
      throw error;
    }
  }

  // Update connection status (accept/reject)
  async updateConnectionStatus(connectionId, status, userId) {
    try {
      if (!['accepted', 'rejected'].includes(status)) {
        throw new Error("Invalid status. Must be 'accepted' or 'rejected'");
      }

      // Verify the connection exists and the user is the addressee
      const connection = await prisma.user_connections.findFirst({
        where: {
          id: connectionId,
          addressee_id: userId,
          status: "pending",
        }
      });

      if (!connection) {
        throw new Error("Connection request not found or not authorized to update");
      }

      // Update the connection status
      const updatedConnection = await prisma.user_connections.update({
        where: { id: connectionId },
        data: { status },
        include: {
          users_user_connections_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          users_user_connections_addressee_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return {
        id: updatedConnection.id,
        request_type: updatedConnection.request_type,
        status: updatedConnection.status,
        created_at: updatedConnection.created_at,
        requester: updatedConnection.users_user_connections_requester_idTousers,
        addressee: updatedConnection.users_user_connections_addressee_idTousers,
      };
    } catch (error) {
      console.error("Update connection status error:", error);
      throw error;
    }
  }

  // Get accepted connections for a user (where they are either requester or addressee)
  async getAcceptedConnections(userId) {
    try {
      const connections = await prisma.user_connections.findMany({
        where: {
          AND: [
            {
              OR: [
                { requester_id: userId },
                { addressee_id: userId }
              ]
            },
            {
              status: "accepted"
            }
          ]
        },
        include: {
          users_user_connections_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              semester: true,
              profile_picture_url: true,
            }
          },
          users_user_connections_addressee_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              semester: true,
              profile_picture_url: true,
            }
          }
        },
        orderBy: {
          updated_at: 'desc' // Most recently accepted first
        }
      });

      // Transform the data to show the "other" user in each connection
      return connections.map(conn => {
        const isRequester = conn.requester_id === userId;
        const connectedUser = isRequester 
          ? conn.users_user_connections_addressee_idTousers 
          : conn.users_user_connections_requester_idTousers;

        return {
          id: conn.id,
          request_type: conn.request_type,
          status: conn.status,
          created_at: conn.created_at,
          accepted_at: conn.updated_at,
          user_role: isRequester ? 'requester' : 'addressee',
          connected_user: connectedUser,
        };
      });
    } catch (error) {
      console.error("Get accepted connections error:", error);
      throw error;
    }
  }
}

module.exports = BuddyService;