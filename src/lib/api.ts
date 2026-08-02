import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface UserSummary {
  id: string;
  email: string;
  display_name: string | null;
  status: string;
  timezone: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserSummary;
}

// Token helpers
export const getAccessToken = () => typeof window !== "undefined" ? localStorage.getItem("mc_access_token") : null;
export const getRefreshToken = () => typeof window !== "undefined" ? localStorage.getItem("mc_refresh_token") : null;

export const setAuthSession = (session: AuthTokenResponse | null) => {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem("mc_access_token", session.access_token);
    localStorage.setItem("mc_refresh_token", session.refresh_token);
    localStorage.setItem("mc_user", JSON.stringify(session.user));
  } else {
    localStorage.removeItem("mc_access_token");
    localStorage.removeItem("mc_refresh_token");
    localStorage.removeItem("mc_user");
  }
};

export const getSavedUser = (): UserSummary | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("mc_user");
  return user ? JSON.parse(user) : null;
};

// Generic API Client
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthSession(null);
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      toast.error("Session expired. Please log in again.");
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.detail || errorJson.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
