"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageMotion } from "@/components/app/motion";
import { EmptyState, PageHeader } from "@/components/app/ui-patterns";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      await auth.signOut();
      router.replace("/login");
    }
    void logout();
  }, [auth, router]);

  return (
    <PageMotion>
      <PageHeader title="Logout" eyebrow="Ending your session" />
      <EmptyState title="Signing you out" detail="Your local session is being cleared securely." />
    </PageMotion>
  );
}
