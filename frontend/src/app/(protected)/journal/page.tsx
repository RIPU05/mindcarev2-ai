"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
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
      <PageHeader title="Journal" eyebrow="Write, search, and revisit your reflections" action={<Link href="/journal/new"><Button><Plus className="size-4" /> New entry</Button></Link>} />
      <SearchFilters />
      {journals.isLoading ? <LoadingPanel /> : journals.isError ? <InlineError error={journals.error} onRetry={() => journals.refetch()} /> : entries.length ? <JournalList entries={entries} /> : <EmptyState title="No entries yet" detail="Your journal entries will appear here once the backend returns data." />}
    </PageMotion>
  );
}
