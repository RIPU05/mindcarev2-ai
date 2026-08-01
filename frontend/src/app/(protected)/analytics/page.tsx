"use client";

import { PageMotion } from "@/components/app/motion";
import { PageHeader, StatCard, TrendCard } from "@/components/app/ui-patterns";
import { Card } from "@/components/ui/card";
import { InlineError, SectionSkeleton } from "@/components/app/api-states";
import { useDashboard, useMoodHistory } from "@/lib/api/hooks";

export default function AnalyticsPage() {
  const dashboard = useDashboard();
  const moods = useMoodHistory();

  return (
    <PageMotion>
      <PageHeader title="Analytics" eyebrow="A measured overview of writing, mood, and reflection habits" />
      {dashboard.isLoading || moods.isLoading ? <SectionSkeleton /> : null}
      {dashboard.isError ? <InlineError error={dashboard.error} onRetry={() => dashboard.refetch()} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Average mood" value={dashboard.data?.latest_mood ?? "unknown"} helper="Backend latest mood" />
        <StatCard label="Journal entries" value={String(dashboard.data?.journal_count ?? 0)} helper="From dashboard summary" />
        <StatCard label="Themes tracked" value="9" helper="Work, sleep, movement lead" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TrendCard />
        <Card>
          <h3 className="font-semibold">Theme frequency</h3>
          <div className="mt-5 space-y-4">{["Work boundaries", "Sleep quality", "Movement", "Family"].map((x, i) => <div key={x}><div className="mb-2 flex justify-between text-sm"><span>{x}</span><span>{[42, 36, 28, 18][i]}</span></div><div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-2 rounded-full bg-sky-300" style={{ width: `${[84, 72, 56, 36][i]}%` }} /></div></div>)}</div>
        </Card>
      </div>
    </PageMotion>
  );
}
