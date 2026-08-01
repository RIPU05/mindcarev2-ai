"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SectionSkeleton } from "@/components/app/api-states";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.session) router.replace("/login");
  }, [auth.isLoading, auth.session, router]);

  if (auth.isLoading) return <SectionSkeleton />;
  if (!auth.session) return null;
  return children;
}
