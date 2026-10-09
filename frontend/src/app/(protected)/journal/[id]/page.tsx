"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Sparkles, Tag as TagIcon } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { LoadingPanel, PageHeader } from "@/components/app/ui-patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineError } from "@/components/app/api-states";
import { useJournalEntry } from "@/lib/api/hooks";

export default function JournalDetailPage() {
  const params = useParams<{ id: string }>();
  const entry = useJournalEntry(params.id);

  const content = entry.data?.content || "";
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <PageMotion>
      <PageHeader
        title={entry.data?.title ?? "Journal Reflection"}
        eyebrow={entry.data ? `Saved on ${new Date(entry.data.created_at).toLocaleDateString(undefined, { dateStyle: "full" })}` : "Loading entry details..."}
        action={
          <Link href="/journal">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" /> Back to Journal
            </Button>
          </Link>
        }
      />

      {entry.isLoading ? (
        <LoadingPanel />
      ) : entry.isError ? (
        <InlineError error={entry.error} onRetry={() => entry.refetch()} />
      ) : entry.data ? (
        <Card className="mx-auto max-w-4xl p-8 glass-panel border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald" className="uppercase text-[10px]">
                {entry.data.source || "manual"}
              </Badge>
              {(entry.data.tags ?? ["reflection"]).map((tag) => (
                <Badge key={tag} variant="sky" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> {readTime} min read
              </span>
              <span>{wordCount} words</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none dark:prose-invert">
            <p className="text-base leading-8 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {entry.data.content}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles className="size-3.5" /> Encrypted Reflection
            </span>
            <span>Entry ID: {entry.data.id}</span>
          </div>
        </Card>
      ) : null}
    </PageMotion>
  );
}
