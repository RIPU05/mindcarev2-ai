"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { supabase } from "@/lib/auth/supabase";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    const { data, error: sessionError } = await supabase.auth.getSession();
    setError(sessionError?.message ?? null);
    setSession(data.session);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void restoreSession();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [restoreSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    accessToken: session?.access_token ?? null,
    isLoading,
    error,
    signInWithEmail: async (email, password) => {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        throw signInError;
      }
    },
    signUpWithEmail: async (email, password, displayName) => {
      setError(null);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      });
      if (signUpError) {
        setError(signUpError.message);
        throw signUpError;
      }
    },
    signInWithGoogle: async () => {
      setError(null);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` }
      });
      if (oauthError) {
        setError(oauthError.message);
        throw oauthError;
      }
    },
    sendPasswordReset: async (email) => {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (resetError) {
        setError(resetError.message);
        throw resetError;
      }
    },
    resetPassword: async (password) => {
      setError(null);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
    },
    signOut: async () => {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }
    },
    refreshSession: async () => {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setError(refreshError.message);
        throw refreshError;
      }
      setSession(data.session);
      return data.session;
    }
  }), [error, isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
