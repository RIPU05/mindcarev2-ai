"use client";

import { Activity, Heart, NotebookPen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CardMotion, PageMotion } from "@/components/app/motion";
import { JournalList, LoadingPanel, MoodCalendar, PageHeader, QuickActions, StatCard, TrendCard } from "@/components/app/ui-patterns";
import { InlineError } from "@/components/app/api-states";
import { useDashboard, useJournalEntries, useMoodHistory } from "@/lib/api/hooks";

export default function DashboardPage() {
  const dashboard = useDashboard();
  const journals = useJournalEntries();
  const moods = useMoodHistory();

  return (
    <PageMotion>
      <PageHeader title="Good evening, Aisha" eyebrow="A quiet place to understand the week" />
      {dashboard.isLoading ? <LoadingPanel /> : dashboard.isError ? <InlineError error={dashboard.error} onRetry={() => dashboard.refetch()} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardMotion><StatCard label="Today's mood" value={dashboard.data?.latest_mood ?? "Not logged"} helper={`Risk level: ${dashboard.data?.risk_level ?? "unknown"}`} /></CardMotion>
        <CardMotion><StatCard label="Journal entries" value={String(dashboard.data?.journal_count ?? 0)} helper="From backend summary" /></CardMotion>
        <CardMotion><StatCard label="Reflection score" value="86%" helper="High confidence pattern" /></CardMotion>
        <CardMotion><StatCard label="Check-ins" value={String(dashboard.data?.mood_count ?? 0)} helper="Mood records" /></CardMotion>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <TrendCard />
        <QuickActions />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2"><NotebookPen className="size-5 text-stone-400" /><h3 className="font-semibold">Recent entries</h3></div>
          {journals.isError ? <InlineError error={journals.error} onRetry={() => journals.refetch()} /> : journals.isLoading ? <LoadingPanel /> : <JournalList entries={journals.data?.items} />}
        </Card>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between"><h3 className="font-semibold">Latest AI reflection</h3><Badge>Mock</Badge></div>
            <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-300">Your calmer entries cluster around mornings with simple routines, lower message volume, and a clear first task.</p>
          </Card>
          {moods.isError ? <InlineError error={moods.error} onRetry={() => moods.refetch()} /> : <MoodCalendar />}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          [Heart, "Self-kindness", "Language is gentler in recent entries."],
          [Activity, "Energy", "Late afternoon is the most variable window."],
          [Sparkles, "Insight", "Movement repeatedly precedes a mood lift."]
        ].map(([Icon, title, text]) => (
          <Card key={String(title)}>
            <Icon className="size-5 text-emerald-600" />
            <h3 className="mt-4 font-semibold">{String(title)}</h3>
            <p className="mt-2 text-sm text-stone-500">{String(text)}</p>
          </Card>
        ))}
      </div>
    </PageMotion>
  );
}
