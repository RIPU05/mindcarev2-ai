"use client";

import { useAuth } from "@/hooks/useAuth";

export function useSession() {
  return useAuth().session;
}
