"use client";

import { Save } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineError, ToastPlaceholder } from "@/components/app/api-states";
import { useCreateJournalEntry } from "@/lib/api/hooks";

export default function NewJournalPage() {
  const createJournal = useCreateJournalEntry();

  return (
    <PageMotion>
      <PageHeader title="New journal" eyebrow="Draft saved locally as a placeholder" action={<Button onClick={() => createJournal.mutate({ title: "Draft journal", content: "Draft journal content.", tags: ["reflection"] })} disabled={createJournal.isPending}><Save className="size-4" /> Save draft</Button>} />
      {createJournal.isError ? <InlineError error={createJournal.error} onRetry={() => createJournal.reset()} /> : null}
      {createJournal.isSuccess ? <ToastPlaceholder message="Journal entry saved through API contract." /> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-h-[620px]">
          <Input placeholder="Entry title" className="border-0 px-0 text-2xl font-semibold shadow-none focus:ring-0" />
          <textarea className="mt-6 min-h-[460px] w-full resize-none bg-transparent text-base leading-8 outline-none placeholder:text-stone-400" placeholder="What feels true right now?" />
          <div className="flex items-center justify-between border-t border-stone-200 pt-4 text-sm text-stone-500 dark:border-stone-800">
            <span>Auto-save placeholder</span>
            <span>0 / 4,000 characters</span>
          </div>
        </Card>
        <aside className="space-y-4">
          <Card><h3 className="font-semibold">Mood</h3><div className="mt-3 flex flex-wrap gap-2">{["Calm", "Hopeful", "Tender", "Tired"].map((m) => <Badge key={m}>{m}</Badge>)}</div></Card>
          <Card><h3 className="font-semibold">Tags</h3><div className="mt-3 flex flex-wrap gap-2">{["work", "sleep", "family", "gratitude"].map((t) => <Badge key={t}>#{t}</Badge>)}</div></Card>
        </aside>
      </div>
    </PageMotion>
  );
}
