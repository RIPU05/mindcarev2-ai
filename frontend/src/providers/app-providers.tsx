"use client";

import type { ReactNode } from "react";

import { QueryProvider } from "@/providers/query-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { AuthProvider } from "@/providers/AuthProvider";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <QueryProvider>{children}</QueryProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
