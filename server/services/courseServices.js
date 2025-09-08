const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all courses
const getAllCourses = async () => {
  try {
    const courses = await prisma.courses.findMany({
      select: {
        id: true,
        course_code: true,
        course_name: true,
        department: true,
        credit_hours: true,
        description: true,
        difficulty: true,
        course_type: true,
        prerequisites: true,
        created_at: true,
        _count: {
          select: {
            course_reviews: true
          }
        }
      },
      orderBy: {
        course_code: 'asc'
      }
    });
    
    return courses;
  } catch (error) {
    console.error("Error in getAllCourses:", error);
    throw error;
  }
};

// Get course by ID
const getCourseById = async (courseId) => {
  try {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        course_reviews: {
          include: {
            users: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        _count: {
          select: {
            course_reviews: true,
            notes: true,
            user_courses: true
          }
        }
      }
    });
    
    return course;
  } catch (error) {
    console.error("Error in getCourseById:", error);
    throw error;
  }
};

// Get courses by department
const getCoursesByDepartment = async (department) => {
  try {
    const courses = await prisma.courses.findMany({
      where: {
        department: {
          contains: department,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        course_code: true,
        course_name: true,
        department: true,
        credit_hours: true,
        description: true,
        difficulty: true,
        course_type: true,
        prerequisites: true,
        _count: {
          select: {
            course_reviews: true
          }
        }
      },
      orderBy: {
        course_code: 'asc'
      }
    });
    
    return courses;
  } catch (error) {
    console.error("Error in getCoursesByDepartment:", error);
    throw error;
  }
};

// Search courses
const searchCourses = async (searchQuery) => {
  try {
    const courses = await prisma.courses.findMany({
      where: {
        OR: [
          {
            course_code: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          },
          {
            course_name: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          },
          {
            department: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        course_code: true,
        course_name: true,
        department: true,
        credit_hours: true,
        description: true,
        difficulty: true,
        course_type: true,
        prerequisites: true,
        _count: {
          select: {
            course_reviews: true
          }
        }
      },
      orderBy: {
        course_code: 'asc'
      }
    });
    
    return courses;
  } catch (error) {
    console.error("Error in searchCourses:", error);
    throw error;
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesByDepartment,
  searchCourses
};