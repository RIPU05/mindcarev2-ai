import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-amber-100/60 via-emerald-100/50 to-amber-100/60 dark:from-stone-850 dark:via-emerald-950/30 dark:to-stone-850 bg-[length:200%_100%]",
        className
      )}
    />
  );
}

