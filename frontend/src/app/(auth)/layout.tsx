import type { ReactNode } from "react";
import { PublicRoute } from "@/components/auth/PublicRoute";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <PublicRoute>{children}</PublicRoute>;
}
