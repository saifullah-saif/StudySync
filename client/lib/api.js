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

// Response interceptor to handle session validation
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
