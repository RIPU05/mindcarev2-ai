"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type DensityMode = "comfortable" | "compact";

export type UserPreferences = {
  theme: ThemeMode;
  density: DensityMode;
  reducedMotion: boolean;
  moodReminders: boolean;
  reflectionSummaries: boolean;
  weeklyRecaps: boolean;
  journalVisibility: "synced_account" | "private_device";
  localControls: boolean;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  density: "comfortable",
  reducedMotion: false,
  moodReminders: true,
  reflectionSummaries: true,
  weeklyRecaps: true,
  journalVisibility: "synced_account",
  localControls: true
};

const STORAGE_KEY = "mindcare_user_preferences";

type SettingsContextType = {
  preferences: UserPreferences;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DensityMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  setNotificationPref: (key: "moodReminders" | "reflectionSummaries" | "weeklyRecaps", value: boolean) => void;
  setPrivacyPref: (key: "journalVisibility" | "localControls", value: "synced_account" | "private_device" | boolean) => void;
  toggleTheme: () => void;
  isDark: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch {
      // Ignore JSON parse error
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage errors
    }
  }, [preferences, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function applyTheme(theme: ThemeMode) {
      let dark = false;
      if (theme === "dark") {
        dark = true;
      } else if (theme === "light") {
        dark = false;
      } else {
        dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    }

    applyTheme(preferences.theme);

    if (preferences.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [preferences.theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("density-compact", preferences.density === "compact");
    document.documentElement.classList.toggle("prefers-reduced-motion", preferences.reducedMotion);
  }, [preferences.density, preferences.reducedMotion]);

  const setTheme = (theme: ThemeMode) => {
    setPreferences((prev) => ({ ...prev, theme }));
  };

  const setDensity = (density: DensityMode) => {
    setPreferences((prev) => ({ ...prev, density }));
  };

  const setReducedMotion = (reducedMotion: boolean) => {
    setPreferences((prev) => ({ ...prev, reducedMotion }));
  };

  const setNotificationPref = (key: "moodReminders" | "reflectionSummaries" | "weeklyRecaps", value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const setPrivacyPref = (key: "journalVisibility" | "localControls", value: "synced_account" | "private_device" | boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTheme = () => {
    setPreferences((prev) => {
      const nextTheme: ThemeMode = isDark ? "light" : "dark";
      return { ...prev, theme: nextTheme };
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        preferences,
        setTheme,
        setDensity,
        setReducedMotion,
        setNotificationPref,
        setPrivacyPref,
        toggleTheme,
        isDark
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
