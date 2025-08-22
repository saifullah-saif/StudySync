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
      if (type === 'mentors') {
        return await this.getMentors(userId, searchQuery);
      } else {
        return await this.getPeers(userId, searchQuery);
      }
    } catch (error) {
      console.error("Get buddies error:", error);
      throw error;
    }
  }
}

module.exports = BuddyService;