import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-stone-200/80 bg-white/85 p-5 shadow-[0_18px_50px_rgba(28,25,23,0.06)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/70",
        className
      )}
      {...props}
    />
  );
}
