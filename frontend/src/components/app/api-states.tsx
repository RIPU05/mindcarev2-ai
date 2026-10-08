"use client";

import { RefreshCw, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";

export function InlineError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const normalized = ApiError.fromUnknown(error);
  return (
    <Card className="border-amber-200/80 bg-amber-50/60 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              {normalized.code === "UNAUTHORIZED"
                ? "Authentication Required"
                : "Unable to sync section data"}
            </h3>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
              {normalized.message}
            </p>
          </div>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="gap-2 border-amber-300/80 bg-white text-stone-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 shrink-0"
            aria-label="Retry loading section"
          >
            <RefreshCw className="size-3.5 text-amber-700 dark:text-amber-400" />
            <span>Retry Connection</span>
          </Button>
        )}
      </div>
    </Card>
  );
}

export function SectionSkeleton() {
  return (
    <Card className="space-y-5 p-6 glass-panel">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </Card>
  );
}

export function ToastPlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
      {message}
    </div>
  );
}

