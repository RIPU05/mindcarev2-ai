"use client";

import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";

export function InlineError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const normalized = ApiError.fromUnknown(error);
  return (
    <Card className="border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <WifiOff className="mt-0.5 size-5 shrink-0 text-rose-500" />
          <div>
            <h3 className="font-semibold text-rose-950 dark:text-rose-100">{normalized.code === "UNAUTHORIZED" ? "Connection needs authentication" : "Unable to load this section"}</h3>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">{normalized.message}</p>
          </div>
        </div>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

export function SectionSkeleton() {
  return (
    <Card className="space-y-4">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    </Card>
  );
}

export function ToastPlaceholder({ message }: { message: string }) {
  return <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 shadow-sm dark:border-stone-800 dark:bg-stone-900">{message}</div>;
}
