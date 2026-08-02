import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  apiRequest,
  setAuthSession,
  getSavedUser,
  getAccessToken,
  UserSummary,
  AuthTokenResponse,
} from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check active user session
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const savedUser = getSavedUser();
      
      if (token && savedUser) {
        setUser(savedUser);
        try {
          // Validate session with backend /auth/me
          const validatedUser = await apiRequest<UserSummary>("/auth/me");
          setUser(validatedUser);
          localStorage.setItem("mc_user", JSON.stringify(validatedUser));
        } catch (error) {
          console.error("Session verification failed", error);
          // If token expired, clear session
          setAuthSession(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AuthTokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthSession(data);
      setUser(data.user);
      toast.success("Welcome back!");
      return data.user;
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AuthTokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      setAuthSession(data);
      setUser(data.user);
      toast.success("Account created successfully!");
      return data.user;
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const token = getAccessToken();
    const refresh = localStorage.getItem("mc_refresh_token");
    setAuthSession(null);
    setUser(null);
    toast.success("Logged out successfully");

    if (token) {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refresh }),
        });
      } catch (error) {
        console.error("Failed to notify logout backend", error);
      }
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };
}
