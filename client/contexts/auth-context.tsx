"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";

// User type definition aligned with backend users table schema
interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  semester: number | null;
  bio: string | null;
  profile_picture_url: string | null;
  cgpa: number | null;
  created_at: string;
}

// Auth context type definition
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    department: string;
    semester?: number | null;
    bio?: string | null;
  }) => Promise<{ success: boolean; user?: User; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  updateProfile: (profileData: {
    name?: string;
    department?: string;
    semester?: number | null;
    bio?: string | null;
    profile_picture_url?: string | null;
    cgpa?: number | null;
  }) => Promise<{ success: boolean; message?: string }>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Try to validate session and get current user data
      try {
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success && userResponse.data.user) {
          setUser(userResponse.data.user);
          localStorage.setItem("user", JSON.stringify(userResponse.data.user));
        } else {
          // No valid session, clear any stored user data
          localStorage.removeItem("user");
          setUser(null);
          console.log("No valid session found");
        }
      } catch (error: any) {
        // No valid session, clear any stored user data
        localStorage.removeItem("user");
        setUser(null);
        console.log("Session validation failed:", error.response?.data?.message || error.message);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);

      if (response.success) {
        const { user } = response.data;

        // Store user data (session token is stored in HTTP-only cookie)
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success("Login successful!");
        return { success: true, user };
      } else {
        toast.error(response.message || "Login failed");
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    department: string;
    semester?: number | null;
    bio?: string | null;
  }) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);

      if (response.success) {
        const { user } = response.data;

        // Store user data (session token is stored in HTTP-only cookie)
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success("Registration successful! Welcome to StudySync!");
        return { success: true, user };
      } else {
        toast.error(response.message || "Registration failed");
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear HTTP-only cookie
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const updateProfile = async (profileData: {
    name?: string;
    department?: string;
    semester?: number | null;
    bio?: string | null;
    profile_picture_url?: string | null;
    cgpa?: number | null;
  }) => {
    try {
      const response = await authAPI.updateProfile(profileData);

      if (response.success) {
        // Update local user state
        const updatedUser = { ...user, ...response.data.user } as User;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        toast.success("Profile updated successfully!");
        return { success: true };
      } else {
        toast.error(response.message || "Profile update failed");
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Profile update failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export User type for other components
export type { User };
