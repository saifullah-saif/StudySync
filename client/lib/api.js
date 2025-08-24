import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  crossDomain: true,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - no need to add auth token as we use HTTP-only cookies
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with requests due to withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop by not retrying validate-session endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/validate-session")
    ) {
      originalRequest._retry = true;

      try {
        // Try to validate session - create a new request without interceptors to avoid infinite loop
        const validateResponse = await axios.get(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
          }/auth/validate-session`,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (validateResponse.data.success) {
          // Session is still valid, retry original request
          return api(originalRequest);
        } else {
          throw new Error("Session invalid");
        }
      } catch (sessionError) {
        // Session invalid, clear storage and redirect to login
        // Only redirect if we're not already on the home page to avoid infinite redirects
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        }
        return Promise.reject(sessionError);
      }
    }

    // For validate-session endpoint failures, just clear storage (no redirect needed as this is expected)
    if (
      error.response?.status === 401 &&
      originalRequest.url?.includes("/auth/validate-session")
    ) {
      localStorage.removeItem("user");
      // Don't redirect here as 401 on validate-session is expected when no valid session exists
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  // Register - updated for users table schema
  register: async (userData) => {
    const response = await api.post("/auth/register", {
      name:
        userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
      email: userData.email,
      password: userData.password,
      department: userData.department,
      semester: userData.semester ? parseInt(userData.semester) : null,
      bio: userData.bio || null,
    });
    return response.data;
  },

  // Login - updated for users table schema
  login: async (credentials) => {
    const response = await api.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Update profile - updated for users table schema
  updateProfile: async (profileData) => {
    const response = await api.put("/auth/update-profile", {
      name: profileData.name,
      department: profileData.department,
      semester: profileData.semester ? parseInt(profileData.semester) : null,
      bio: profileData.bio,
      profile_picture_url: profileData.profile_picture_url,
      cgpa: profileData.cgpa ? parseFloat(profileData.cgpa) : null,
    });
    return response.data;
  },

  // Validate session - use direct axios call to avoid interceptor infinite loop
  validateSession: async () => {
    try {
      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        }/auth/validate-session`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      // Handle 401 errors gracefully - this is expected when no valid session exists
      if (error.response?.status === 401) {
        return {
          success: false,
          message: "No valid session",
          error: "UNAUTHORIZED",
        };
      }
      // Re-throw other errors
      throw error;
    }
  },
};

export const profileAPI = {
  // Get user profile with courses and reviews
  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },

  // Get all available courses
  getAllCourses: async () => {
    const response = await api.get("/profile/courses");
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put("/profile", {
      name: profileData.name,
      email: profileData.email,
      department: profileData.department,
      semester: profileData.semester ? parseInt(profileData.semester) : null,
      bio: profileData.bio,
      courses: profileData.courses || [],
      previousCourses: profileData.previousCourses || [],
    });
    return response.data;
  },
};

export const buddyAPI = {
  // Get study buddies (peers or mentors)
  getBuddies: async (type = 'peers', searchQuery = '') => {
    const params = new URLSearchParams({ type });
    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    const response = await api.get(`/buddies?${params.toString()}`);
    return response.data;
  },

  // Create a new connection request (study invite or mentoring request)
  createConnection: async (addresseeId, requestType) => {
    const response = await api.post('/buddies/connections', {
      addresseeId,
      requestType
    });
    return response.data;
  },

  // Get pending connection requests
  getPendingConnections: async () => {
    const response = await api.get('/buddies/connections');
    return response.data;
  },

  // Get pending invitations (alias for getPendingConnections)
  getPendingInvitations: async () => {
    const response = await api.get('/buddies/invitations');
    return response.data;
  },

  // Get accepted connections
  getAcceptedConnections: async () => {
    const response = await api.get('/buddies/connections/accepted');
    return response.data;
  },

  // Respond to invitation (accept or reject)
  respondToInvitation: async (invitationId, response) => {
    const apiResponse = await api.put(`/buddies/invitations/${invitationId}/respond`, {
      response
    });
    return apiResponse.data;
  },

  // Update connection status (accept or reject)
  updateConnectionStatus: async (connectionId, status) => {
    const response = await api.put(`/buddies/connections/${connectionId}`, {
      status
    });
    return response.data;
  },
};

export const chatAPI = {
  // Get chat history with a specific user
  getChatHistory: async (userId) => {
    const response = await api.get(`/chats/${userId}`);
    return response.data;
  },

  // Send a message to a specific user
  sendMessage: async (userId, content) => {
    const response = await api.post(`/chats/${userId}`, { content });
    return response.data;
  },

  // Get all conversations for the current user
  getConversations: async () => {
    const response = await api.get('/chats/conversations');
    return response.data;
  },

  // Mark messages from a specific user as read
  markAsRead: async (userId) => {
    const response = await api.put(`/chats/${userId}/read`);
    return response.data;
  },
};

export const apiRequest = {
  get: async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
  },
};

export default api;
