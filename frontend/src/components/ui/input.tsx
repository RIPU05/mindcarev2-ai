import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-4 focus:ring-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:focus:ring-stone-800/50",
        className
      )}
      {...props}
    />
  );
}
