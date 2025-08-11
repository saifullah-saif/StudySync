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

export const notesAPI = {
  // Upload notes
  upload: async (formData) => {
    const response = await api.post("/notes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get all notes with filters
  getAllNotes: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.course) params.append("course", filters.course);
    if (filters.search) params.append("search", filters.search);
    if (filters.visibility) params.append("visibility", filters.visibility);
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.offset) params.append("offset", filters.offset.toString());

    const response = await api.get(`/notes?${params.toString()}`);
    return response.data;
  },

  // Get note by ID
  getNoteById: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  // Get notes by user
  getUserNotes: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.course) params.append("course", filters.course);
    if (filters.search) params.append("search", filters.search);
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.offset) params.append("offset", filters.offset.toString());

    const response = await api.get(
      `/notes/user/${userId}?${params.toString()}`
    );
    return response.data;
  },

  // Update note
  updateNote: async (id, noteData) => {
    const response = await api.put(`/notes/${id}`, noteData);
    return response.data;
  },

  // Delete note
  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  // Download note file
  downloadNote: async (id) => {
    const response = await api.get(`/notes/${id}/download`, {
      responseType: "blob",
    });
    return response;
  },

  // Like/Unlike note
  toggleLike: async (id) => {
    const response = await api.post(`/notes/${id}/like`);
    return response.data;
  },

  // Get courses list
  getCourses: async () => {
    const response = await api.get("/notes/courses");
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
