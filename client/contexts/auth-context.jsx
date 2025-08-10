"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    initializeAuth();
    initializeSupabaseAuth();
  }, []);

  const initializeSupabaseAuth = async () => {
    try {
      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        await handleSupabaseSignIn(session);
      }

      {
        /* Every Tab Change calls login
      

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);

        if (event === "SIGNED_IN" && session) {
          await handleSupabaseSignIn(session);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          localStorage.removeItem("user");
        }
      });

      return () => subscription.unsubscribe();
      */
      }
    } catch (error) {
      console.error("Supabase auth initialization error:", error);
    }
  };

  const initializeAuth = async () => {
    try {
      // Check if user is logged in from localStorage
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        // Validate session cookie by calling the backend
        try {
          const response = await authAPI.validateSession();
          if (response.success) {
            // Session is valid, set user from stored data
            setUser(JSON.parse(storedUser));
          } else {
            // Session invalid, clear storage
            localStorage.removeItem("user");
          }
        } catch (error) {
          // Session invalid, clear storage
          localStorage.removeItem("user");
        }
      } else {
        // No stored user, try to validate session anyway in case cookie exists
        try {
          const response = await authAPI.validateSession();
          if (response.success) {
            // Session is valid, get current user data
            const userResponse = await authAPI.getCurrentUser();
            if (userResponse.success) {
              setUser(userResponse.data.user);
              localStorage.setItem(
                "user",
                JSON.stringify(userResponse.data.user)
              );
            }
          }
        } catch (error) {
          // No valid session, user remains null
          console.log(error);
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseSignIn = async (session) => {
    try {
      if (session?.user) {
        const supabaseUser = session.user;

        // Sync user data with backend database
        const response = await authAPI.syncOAuthUser(supabaseUser);

        if (response.success) {
          const { user } = response.data;

          // Store user data (session token is in HTTP-only cookie)
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));

          toast.success("Login successful!");
          return { success: true, user };
        } else {
          toast.error(response.message || "Failed to sync user data");
          return { success: false, message: response.message };
        }
      }
    } catch (error) {
      console.error("Supabase sign in error:", error);
      toast.error("Authentication failed. Please try again.");
      return { success: false, message: "Authentication failed" };
    }
  };

  const oAuthLogin = async (provider = "google") => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("OAuth login error:", error);
      toast.error("OAuth login failed. Please try again.");
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
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
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);

      if (response.success) {
        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || "Registration failed");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setSession(null);
      localStorage.removeItem("user");
      // HTTP-only cookies are cleared by the server
      toast.success("Logged out successfully");
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.verifyEmail(token);

      if (response.success) {
        // If user data is returned, automatically log them in
        if (response.data && response.data.user) {
          const { user } = response.data;

          // Store user data (session token is in HTTP-only cookie)
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));

          toast.success("Email verified and logged in successfully!");
          return { success: true, user, autoLoggedIn: true };
        } else {
          toast.success("Email verified successfully!");
          return { success: true };
        }
      } else {
        toast.error(response.message || "Email verification failed");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Email verification failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const response = await authAPI.resendVerificationEmail(email);

      if (response.success) {
        toast.success("Verification email sent!");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to send verification email");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send verification email";
      toast.error(message);
      return { success: false, message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);

      if (response.success) {
        toast.success("Password reset instructions sent to your email");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to send password reset email");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send password reset email";
      toast.error(message);
      return { success: false, message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await authAPI.resetPassword(token, newPassword);

      if (response.success) {
        toast.success("Password reset successfully!");
        return { success: true };
      } else {
        toast.error(response.message || "Password reset failed");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || "Password reset failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(
        currentPassword,
        newPassword
      );

      if (response.success) {
        toast.success("Password changed successfully!");
        return { success: true };
      } else {
        toast.error(response.message || "Password change failed");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);

      if (response.success) {
        // Update local user state
        const updatedUser = { ...user, profile: response.data.profile };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        toast.success("Profile updated successfully!");
        return { success: true };
      } else {
        toast.error(response.message || "Profile update failed");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleOAuthCallback = async (provider, code) => {
    try {
      setLoading(true);
      const response = await authAPI.handleOAuthCallback(provider, code);

      if (response.success) {
        const { user } = response.data;

        // Store user data (session token is in HTTP-only cookie)
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success("Login successful!");
        return { success: true, user };
      } else {
        toast.error(response.message || "OAuth login failed");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || "OAuth login failed";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const getOAuthUrl = async (provider) => {
    try {
      const response = await authAPI.getOAuthUrl(provider);

      if (response.success) {
        return { success: true, url: response.data.url };
      } else {
        toast.error(response.message || "Failed to get OAuth URL");
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to get OAuth URL";
      toast.error(message);
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        logout,
        register,
        loading,
        updateUser,
        verifyEmail,
        resendVerificationEmail,
        forgotPassword,
        resetPassword,
        changePassword,
        updateProfile,
        oAuthLogin,
        getOAuthUrl,
        handleOAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
