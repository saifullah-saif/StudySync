import axios from "axios";


const getApiUrl = () => {
  
  if (process.env.NODE_ENV === "production") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://study-sync-server-sigma.vercel.app/api"
    );
  }

  
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
};

console.log("API Base URL:", getApiUrl());

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  crossDomain: true,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
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
          `${getApiUrl()}/auth/validate-session`,
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

  // Update user profile with optional file upload
  // Update user profile with optional profile picture
  updateProfile: async (formData) => {
    const response = await api.put("/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export const buddyAPI = {
  // Get study buddies (peers or mentors)
  getBuddies: async (type = "peers", searchQuery = "") => {
    const params = new URLSearchParams({ type });
    if (searchQuery && searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }
    const response = await api.get(`/buddies?${params.toString()}`);
    return response.data;
  },

  // Create a new connection request (study invite or mentoring request)
  createConnection: async (addresseeId, requestType) => {
    const response = await api.post("/buddies/connections", {
      addresseeId,
      requestType,
    });
    return response.data;
  },

  // Get pending connection requests
  getPendingConnections: async () => {
    const response = await api.get("/buddies/connections");
    return response.data;
  },

  // Get pending invitations (alias for getPendingConnections)
  getPendingInvitations: async () => {
    const response = await api.get("/buddies/invitations");
    return response.data;
  },

  // Get accepted connections
  getAcceptedConnections: async () => {
    const response = await api.get("/buddies/connections/accepted");
    return response.data;
  },

  // Respond to invitation (accept or reject)
  respondToInvitation: async (invitationId, response) => {
    const apiResponse = await api.put(
      `/buddies/invitations/${invitationId}/respond`,
      {
        response,
      }
    );
    return apiResponse.data;
  },

  // Update connection status (accept or reject)
  updateConnectionStatus: async (connectionId, status) => {
    const response = await api.put(`/buddies/connections/${connectionId}`, {
      status,
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
    const response = await api.get("/chats/conversations");
    return response.data;
  },

  // Mark messages from a specific user as read
  markAsRead: async (userId) => {
    const response = await api.put(`/chats/${userId}/read`);
    return response.data;
  },
};

export const reviewAPI = {
  // Create a new review
  createReview: async (reviewData) => {
    const response = await api.post("/reviews", reviewData);
    return response.data;
  },

  // Update an existing review
  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Get all reviews for a specific course
  getCourseReviews: async (courseId) => {
    const response = await api.get(`/reviews/course/${courseId}`);
    return response.data;
  },

  // Get user's review for a specific course
  getUserReview: async (courseId) => {
    const response = await api.get(`/reviews/user/course/${courseId}`);
    return response.data;
  },

  // Update review votes (upvote/downvote)
  updateReviewVotes: async (reviewId, voteType) => {
    const response = await api.patch(`/reviews/${reviewId}/vote`, { voteType });
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
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

  // Extract text from document (replaces langchain extraction)
  extractText: async (documentId) => {
    const response = await api.get(`/documents/extract/${documentId}`);
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

// DEPRECATED: langchainAPI - Replaced by documentAPI.extractText()
// Kept for reference during migration, will be removed after testing
export const langchainAPI = {
  // DEPRECATED: Use documentAPI.extractText(documentId) instead
  processFileFromUrl: async (fileUrl, fileName) => {
    console.warn("⚠️ langchainAPI.processFileFromUrl is deprecated. Use documentAPI.extractText() instead");
    // For backward compatibility during migration, extract documentId from fileUrl
    // This is a temporary shim that will be removed
    throw new Error("langchainAPI is deprecated. Please use documentAPI.extractText(documentId) instead");
  },

  // DEPRECATED: Use documentAPI.extractText(documentId) instead
  extractTextFromDocument: async (documentId) => {
    console.warn("⚠️ langchainAPI.extractTextFromDocument is deprecated. Use documentAPI.extractText() instead");
    throw new Error("langchainAPI is deprecated. Please use documentAPI.extractText(documentId) instead");
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
    console.log("🎯 API: Recording flashcard attempt", {
      sessionId,
      flashcardId,
      isCorrect,
      responseTimeSeconds,
    });

    try {
      const response = await api.post("/practice/flashcard-attempts", {
        sessionId,
        flashcardId,
        isCorrect,
        responseTimeSeconds,
      });
      return response.data;
    } catch (error) {
      console.error("🔥 API Error Details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

      // Provide more specific error messages for authentication issues
      if (error.response?.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again to continue studying."
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          "You don't have permission to access this study session."
        );
      } else if (error.response?.status === 404) {
        throw new Error("The flashcard or session could not be found.");
      } else if (error.response?.status >= 500) {
        console.error("🔥 Server Error Response:", error.response?.data);
        throw new Error(
          `Server error (${error.response?.status}): ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  },

  // Complete practice session
  completePracticeSession: async (
    sessionId,
    cardsStudied,
    cardsCorrect,
    totalTimeSeconds
  ) => {
    try {
      const response = await api.post(
        `/practice/flashcard-sessions/${sessionId}/complete`,
        {
          cardsStudied,
          cardsCorrect,
          totalTimeSeconds,
        }
      );
      return response.data;
    } catch (error) {
      // Provide more specific error messages for authentication issues
      if (error.response?.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again to complete the study session."
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          "You don't have permission to access this study session."
        );
      } else if (error.response?.status === 404) {
        throw new Error("The study session could not be found.");
      } else if (error.response?.status >= 500) {
        throw new Error(
          "Server error occurred while completing the session. Please try again."
        );
      }
      throw error;
    }
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

  // Update individual flashcard learning state
  updateCard: async (cardId, updateData) => {
    try {
      const response = await api.put(`/flashcards/card/${cardId}`, updateData);
      return { success: true, data: response.data };
    } catch (error) {
      console.warn("Failed to update card on server:", error);
      return { success: false, error: error.message };
    }
  },

  // Batch update multiple cards
  updateCards: async (cardUpdates) => {
    try {
      const response = await api.put("/flashcards/cards/batch", {
        cards: cardUpdates,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.warn("Failed to batch update cards on server:", error);
      return { success: false, error: error.message };
    }
  },

  // Save learning session progress
  saveSessionProgress: async (sessionData) => {
    try {
      const response = await api.post("/flashcards/session", sessionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.warn("Failed to save session progress:", error);
      return { success: false, error: error.message };
    }
  },

  // Get learning statistics
  getLearningStats: async (deckId = null) => {
    try {
      const url = deckId ? `/flashcards/stats/${deckId}` : "/flashcards/stats";
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.warn("Failed to fetch learning stats:", error);
      return { success: false, error: error.message };
    }
  },

  // Streak management endpoints
  getStreakData: async () => {
    try {
      const response = await api.get("/flashcards/streak");
      return { success: true, data: response.data };
    } catch (error) {
      console.warn("Failed to fetch streak data:", error);
      return { success: false, error: error.message };
    }
  },

  updateStreak: async (streakData) => {
    try {
      const response = await api.post("/flashcards/streak", streakData);
      return { success: true, data: response.data };
    } catch (error) {
      console.warn("Failed to update streak:", error);
      return { success: false, error: error.message };
    }
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

  // Complete practice session
  completePracticeSession: async (
    sessionId,
    sessionData,
    includeUsageUpdates = true
  ) => {
    const response = await api.post(
      `/practice/practice-sessions/${sessionId}/complete`,
      {
        ...sessionData,
        includeUsageUpdates,
      }
    );
    return response.data;
  },
};

// User Stats API
export const statsAPI = {
  // Get user statistics
  getUserStats: async () => {
    const response = await api.get("/stats/user");
    return response.data;
  },

  // Update user statistics after study session
  updateUserStats: async (statsData) => {
    const response = await api.post("/stats/user", statsData);
    return response.data;
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

// View Notes API for detailed note viewing functionality
export const viewNotesAPI = {
  // Get note details with all interactions and comments
  getNoteDetails: async (id) => {
    const response = await api.get(`/view-notes/${id}`);
    return response.data;
  },

  // Get comments for a specific note
  getNoteComments: async (id) => {
    const response = await api.get(`/view-notes/${id}/comments`);
    return response.data;
  },

  // Add a comment to a note
  addComment: async (id, commentData) => {
    const response = await api.post(`/view-notes/${id}/comments`, commentData);
    return response.data;
  },

  // Toggle like for a note
  toggleLike: async (id) => {
    const response = await api.post(`/view-notes/${id}/like`);
    return response.data;
  },

  // Toggle vote (upvote/downvote) for a note
  toggleVote: async (id, voteType) => {
    const response = await api.post(`/view-notes/${id}/vote`, { voteType });
    return response.data;
  },

  // Download note file
};

export const libraryAPI = {
  // Fetch user bookings
  getUserBookings: async () => {
    const response = await api.get("/reservations/my");
    return response.data;
  },

  // Create a new room reservation
  createReservation: async (reservationData) => {
    const response = await api.post("/reservations", reservationData);
    return response.data;
  },

  // Cancel a room reservation
  cancelReservation: async (reservationId) => {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  },

  // Get all library rooms
  getAllRooms: async () => {
    const response = await api.get("/library-rooms", {
      timeout: 10000,
    });
    return response.data;
  },

  // Get room details by ID
  getRoomDetails: async (roomId) => {
    const response = await api.get(`/library-rooms/${roomId}`);
    return response.data;
  },

  // Get seats for a specific room
  getRoomSeats: async (roomId) => {
    const response = await api.get(`/seats/room/${roomId}`);
    return response.data;
  },

  // Get booked seats for a specific room and time period
  getBookedSeats: async (roomId, startTime, endTime) => {
    const params = new URLSearchParams({
      start_time: startTime,
      end_time: endTime,
    });
    const response = await api.get(
      `/seats/room/${roomId}/booked?${params.toString()}`
    );
    return response.data;
  },

  // Reserve a specific seat
  reserveSeat: async (seatId, reservationData) => {
    const response = await api.post(
      `/seats/${seatId}/reserve`,
      reservationData
    );
    return response.data;
  },
};

//fetching courses for courses page
export const courseAPI = {
  getAllCourses: async () => {
    const response = await api.get("/courses");
    return response;
  },

  // Get single course by ID
  getCourseById: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  // Get user's completed courses
  getMyCompletedCourses: async () => {
    const response = await api.get("/courses/my-courses");
    return response;
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
