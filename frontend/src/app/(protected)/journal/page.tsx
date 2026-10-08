"use client";

import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { EmptyState, JournalList, LoadingPanel, PageHeader, SearchFilters } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { useJournalEntries } from "@/lib/api/hooks";
import { InlineError } from "@/components/app/api-states";

export default function JournalPage() {
  const journals = useJournalEntries();
  const entries = journals.data?.items ?? [];

  return (
    <PageMotion>
      <PageHeader
        title="Journal Reflections"
        eyebrow="Write, search, and revisit your inner space"
        action={
          <Link href="/journal/new">
            <Button className="gap-2">
              <Plus className="size-4" /> New Entry
            </Button>
          </Link>
        }
      />

      <SearchFilters />

      {journals.isLoading ? (
        <LoadingPanel />
      ) : journals.isError ? (
        <InlineError error={journals.error} onRetry={() => journals.refetch()} />
      ) : entries.length ? (
        <JournalList entries={entries} />
      ) : (
        <EmptyState
          title="No reflections recorded yet"
          detail="Your inner thoughts, mood check-ins, and AI insights will be safely stored here as you log them."
          icon={BookOpen}
          action={
            <Link href="/journal/new">
              <Button className="gap-2">
                <Plus className="size-4" /> Write your first reflection
              </Button>
            </Link>
          }
        />
      )}
    </PageMotion>
  );
}
