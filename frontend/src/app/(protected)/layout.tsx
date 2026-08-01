import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedAppShell } from "@/components/app/page-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ProtectedAppShell>{children}</ProtectedAppShell>
    </ProtectedRoute>
  );
}
