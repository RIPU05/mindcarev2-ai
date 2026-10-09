"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { EmptyState, JournalList, LoadingPanel, PageHeader, SearchFilters } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { useJournalEntries } from "@/lib/api/hooks";
import { InlineError } from "@/components/app/api-states";

function JournalContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const s = searchParams.get("search");
    if (s !== null) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  const journals = useJournalEntries();
  const rawEntries = journals.data?.items ?? [];

  const filteredEntries = useMemo(() => {
    let result = [...rawEntries];

    if (sourceFilter !== "all") {
      result = result.filter((e) => (e.source || "manual") === sourceFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          e.content.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [rawEntries, searchQuery, sourceFilter, sortOrder]);

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

      <SearchFilters
        query={searchQuery}
        onQueryChange={setSearchQuery}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        sortOrder={sortOrder}
        onSortToggle={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
      />

      {journals.isLoading ? (
        <LoadingPanel />
      ) : journals.isError ? (
        <InlineError error={journals.error} onRetry={() => journals.refetch()} />
      ) : filteredEntries.length ? (
        <JournalList entries={filteredEntries} />
      ) : (
        <EmptyState
          title={searchQuery ? "No matching reflections found" : "No reflections recorded yet"}
          detail={
            searchQuery
              ? `No journal entries matched "${searchQuery}". Try a different keyword or reset filters.`
              : "Your inner thoughts, mood check-ins, and AI insights will be safely stored here as you log them."
          }
          icon={BookOpen}
          action={
            searchQuery ? (
              <Button variant="secondary" onClick={() => setSearchQuery("")}>
                Reset Search
              </Button>
            ) : (
              <Link href="/journal/new">
                <Button className="gap-2">
                  <Plus className="size-4" /> Write your first reflection
                </Button>
              </Link>
            )
          }
        />
      )}
    </PageMotion>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <JournalContent />
    </Suspense>
  );
}
