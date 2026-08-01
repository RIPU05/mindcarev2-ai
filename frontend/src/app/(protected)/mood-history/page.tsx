"use client";

import { PageMotion } from "@/components/app/motion";
import { LoadingPanel, MoodCalendar, PageHeader, TrendCard } from "@/components/app/ui-patterns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeline } from "@/lib/mock/app-data";
import { useMoodHistory } from "@/lib/api/hooks";
import { InlineError } from "@/components/app/api-states";

export default function MoodHistoryPage() {
  const moods = useMoodHistory();

  return (
    <PageMotion>
      <PageHeader title="Mood history" eyebrow="Patterns across check-ins and journal tone" />
      {moods.isLoading ? <LoadingPanel /> : moods.isError ? <InlineError error={moods.error} onRetry={() => moods.refetch()} /> : null}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <TrendCard />
        <MoodCalendar />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Timeline</h3>
          <div className="mt-5 space-y-5">
            {timeline.map((item) => <div key={item.time} className="border-l border-stone-200 pl-4 dark:border-stone-800"><div className="text-xs text-stone-500">{item.time}</div><div className="font-medium">{item.title}</div><p className="text-sm text-stone-500">{item.detail}</p></div>)}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Emotion breakdown</h3>
          <div className="mt-5 space-y-4">
            {["Calm", "Focused", "Hopeful", "Tired"].map((label, i) => <div key={label}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span>{[34, 27, 22, 17][i]}%</span></div><div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${[34, 27, 22, 17][i]}%` }} /></div></div>)}
          </div>
          <div className="mt-6 flex gap-2"><Badge>Monthly overview</Badge><Badge>Mood distribution</Badge></div>
        </Card>
      </div>
    </PageMotion>
  );
}
