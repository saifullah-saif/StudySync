import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
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
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
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
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
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

// Document API for flashcard generation
export const documentAPI = {
  // Upload document (PDF, DOCX, TXT)
  uploadDocument: async (file, title) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Paste text content
  pasteDocument: async (title, text) => {
    const response = await api.post("/documents/paste", {
      title,
      text,
    });
    return response.data;
  },

  // Generate flashcards from document
  generateFlashcards: async (data) => {
    const response = await api.post("/documents/generate-flashcards", data);
    return response.data;
  },

  // Get deck details (authenticated endpoint)
  getDeck: async (deckId) => {
    const response = await api.get(`/practice/decks/${deckId}`);
    return response.data;
  },
};

// File Management API
export const fileAPI = {
  // Upload file
  uploadFile: async (file, title) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get all user files
  getUserFiles: async (
    page = 1,
    limit = 10,
    search = "",
    fileType = "",
    sortBy = "uploadDate",
    sortOrder = "desc"
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (search) params.append("search", search);
    if (fileType) params.append("fileType", fileType);

    const response = await api.get(`/files?${params.toString()}`);
    return response.data;
  },

  // Get file details
  getFileDetails: async (fileId) => {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  // Download file
  downloadFile: async (fileId) => {
    console.log("🔍 API Debug - Making download request for fileId:", fileId);
    // Remove responseType: "blob" to get JSON response with signed URL
    const response = await api.get(`/files/${fileId}/download`);
    console.log("🔍 API Debug - Raw response:", response);
    console.log("🔍 API Debug - Response data:", response.data);
    console.log("🔍 API Debug - Response status:", response.status);
    return response;
  },

  // Update file metadata
  updateFile: async (fileId, data) => {
    const response = await api.put(`/files/${fileId}`, data);
    return response.data;
  },

  // Get file statistics
  getFileStats: async () => {
    const response = await api.get("/files/stats");
    return response.data;
  },
};

// Add this langchainAPI object to your existing api.js
export const langchainAPI = {
  // Process file with LangChain
  processFile: async (fileId) => {
    const response = await api.post(`/langchain/process/${fileId}`);
    return response.data;
  },

  // Get processed file content
  getFileContent: async (fileId) => {
    const response = await api.get(`/langchain/content/${fileId}`);
    return response.data;
  },

  // Extract chunks from text
  extractChunks: async (text, options = {}) => {
    const response = await api.post("/langchain/extract-chunks", {
      text,
      options,
    });
    return response.data;
  },

  // Process file from URL with LangChain
  processFileFromUrl: async (fileUrl, fileName) => {
    const response = await api.post("/langchain/process-url", {
      fileUrl,
      fileName,
    });
    return response.data;
  },
};

// Flashcard Generation API
export const generationAPI = {
  // Generate flashcards from a file
  generateFlashcardsFromFile: async (documentId, options = {}) => {
    const {
      deckTitle,
      cardType = "basic",
      targetDifficulty = 3,
      maxCards = 20,
      templateId = null,
    } = options;

    const response = await api.post(
      `/generation/files/${documentId}/flashcards`,
      {
        deckTitle,
        cardType,
        targetDifficulty,
        maxCards,
        templateId,
      }
    );
    return response.data;
  },

  // Get generation job status
  getJobStatus: async (jobId) => {
    const response = await api.get(`/generation/jobs/${jobId}`);
    return response.data;
  },

  // Get user's generation jobs
  getUserJobs: async (
    page = 1,
    limit = 10,
    status = "",
    sortBy = "created_at",
    sortOrder = "desc"
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (status) params.append("status", status);

    const response = await api.get(`/generation/jobs?${params.toString()}`);
    return response.data;
  },

  // Cancel a generation job
  cancelJob: async (jobId) => {
    const response = await api.delete(`/generation/jobs/${jobId}`);
    return response.data;
  },

  // Get available generation templates
  getGenerationTemplates: async () => {
    const response = await api.get("/generation/templates");
    return response.data;
  },
};

// Practice API
export const practiceAPI = {
  // Get user's decks
  getUserDecks: async (page = 1, limit = 10) => {
    const response = await api.get(
      `/practice/decks?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Create manual deck
  createDeck: async (deckData) => {
    const response = await api.post("/practice/decks", deckData);
    return response.data;
  },

  // Get deck details
  getDeck: async (deckId) => {
    const response = await api.get(`/practice/decks/${deckId}`);
    return response.data;
  },

  // Create practice session
  createPracticeSession: async (deckId, sessionType = "all_cards") => {
    const response = await api.post("/practice/flashcard-sessions", {
      deckId,
      sessionType,
    });
    return response.data;
  },

  // Get practice session
  getPracticeSession: async (sessionId) => {
    const response = await api.get(`/practice/practice-sessions/${sessionId}`);
    return response.data;
  },

  // Record flashcard attempt
  recordFlashcardAttempt: async (
    sessionId,
    flashcardId,
    isCorrect,
    responseTimeSeconds
  ) => {
    const response = await api.post("/practice/flashcard-attempts", {
      sessionId,
      flashcardId,
      isCorrect,
      responseTimeSeconds,
    });
    return response.data;
  },

  // Complete practice session
  completePracticeSession: async (
    sessionId,
    cardsStudied,
    cardsCorrect,
    totalTimeSeconds
  ) => {
    const response = await api.post(
      `/practice/flashcard-sessions/${sessionId}/complete`,
      {
        cardsStudied,
        cardsCorrect,
        totalTimeSeconds,
      }
    );
    return response.data;
  },
};

export const flashcardAPI = {
  // Generate flashcards from Q&A data
  generateFlashcards: async (qsAns, title, sourceFileId) => {
    const response = await api.post("/flashcards/generate", {
      qsAns,
      title,
      sourceFileId: sourceFileId || null,
    });
    return response.data;
  },

  // Get user's flashcard decks
  getUserDecks: async () => {
    const response = await api.get("/flashcards/decks");
    return response.data;
  },

  // Get specific flashcard deck
  getDeck: async (deckId) => {
    const response = await api.get(`/flashcards/deck/${deckId}`);
    return response.data;
  },

  // Update flashcard deck progress
  updateDeck: async (deckId, updateData) => {
    const response = await api.put(`/flashcards/deck/${deckId}`, updateData);
    return response.data;
  },

  // Add saveDeck method
  saveDeck: async (deckData) => {
    const response = await api.post("/flashcard/save", deckData);
    return response.data;
  },

  // Delete flashcard deck
  deleteDeck: async (deckId) => {
    const response = await api.delete(`/flashcards/deck/${deckId}`);
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
