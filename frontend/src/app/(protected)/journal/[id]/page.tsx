"use client";

import { useParams } from "next/navigation";
import { PageMotion } from "@/components/app/motion";
import { LoadingPanel, PageHeader } from "@/components/app/ui-patterns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InlineError } from "@/components/app/api-states";
import { useJournalEntry } from "@/lib/api/hooks";

export default function JournalDetailPage() {
  const params = useParams<{ id: string }>();
  const entry = useJournalEntry(params.id);

  return (
    <PageMotion>
      <PageHeader title={entry.data?.title ?? "Journal detail"} eyebrow={entry.data ? new Date(entry.data.created_at).toLocaleString() : "Connected to API"} />
      {entry.isLoading ? <LoadingPanel /> : entry.isError ? <InlineError error={entry.error} onRetry={() => entry.refetch()} /> : null}
      <Card className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap gap-2">{(entry.data?.tags ?? []).map((tag) => <Badge key={tag}>#{tag}</Badge>)}</div>
        <p className="text-lg leading-9 text-stone-700 dark:text-stone-200">{entry.data?.content ?? "Entry content will appear here when the API returns a journal record."}</p>
      </Card>
    </PageMotion>
  );
}
