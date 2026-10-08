import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] dark:from-emerald-500 dark:to-teal-500 dark:shadow-emerald-950/40",
    secondary:
      "border border-slate-200/90 bg-white/90 text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-850",
    ghost:
      "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
    outline:
      "border border-emerald-500/30 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/70 hover:border-emerald-500/50 active:scale-[0.98] dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
    danger:
      "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.98] dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/70"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
