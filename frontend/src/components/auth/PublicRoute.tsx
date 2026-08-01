"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function PublicRoute({ children }: PropsWithChildren) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.session) router.replace("/dashboard");
  }, [auth.isLoading, auth.session, router]);

  return children;
}
