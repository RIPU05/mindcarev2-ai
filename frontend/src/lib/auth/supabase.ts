"use client";

import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep the app bootable in local scaffolding while still surfacing clear auth errors.
  console.warn("Supabase environment variables are not configured.");
}

const resolvedUrl = supabaseUrl ?? "https://missing-supabase-url.supabase.co";
const resolvedAnonKey = supabaseAnonKey ?? "missing-anon-key";

export const supabase = createBrowserClient(resolvedUrl, resolvedAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "mindcare.auth"
  }
});
