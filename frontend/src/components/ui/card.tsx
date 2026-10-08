import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-none",
        className
      )}
      {...props}
    />
  );
}
