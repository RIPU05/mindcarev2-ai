"use client";

import { PageMotion } from "@/components/app/motion";
import { LoadingPanel, MoodCalendar, PageHeader, TrendCard } from "@/components/app/ui-patterns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeline } from "@/lib/mock/app-data";
import { useMoodHistory } from "@/lib/api/hooks";
import { InlineError } from "@/components/app/api-states";
import { Sparkles, Activity, Calendar } from "lucide-react";

export default function MoodHistoryPage() {
  const moods = useMoodHistory();

  return (
    <PageMotion>
      <PageHeader
        title="Mood History & Patterns"
        eyebrow="Emotional trends across check-ins and journal tone"
      />

      {moods.isLoading ? (
        <LoadingPanel />
      ) : moods.isError ? (
        <InlineError error={moods.error} onRetry={() => moods.refetch()} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <TrendCard />
        <MoodCalendar />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Timeline Log */}
        <Card className="glass-card">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Check-in Timeline</h3>
            </div>
            <Badge variant="emerald">Live Logs</Badge>
          </div>

          <div className="space-y-6">
            {timeline.map((item) => (
              <div key={item.time} className="relative border-l-2 border-emerald-500/30 pl-5 dark:border-emerald-500/40">
                <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-emerald-500" />
                <div className="text-xs font-semibold text-slate-400">{item.time}</div>
                <div className="mt-1 font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed dark:text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Emotion Distribution */}
        <Card className="glass-card">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Emotion Breakdown</h3>
            </div>
            <Badge variant="sky">Monthly</Badge>
          </div>

          <div className="space-y-5">
            {[
              ["Calm & Centered", 34, "bg-emerald-500"],
              ["Focused", 27, "bg-teal-500"],
              ["Hopeful", 22, "bg-sky-500"],
              ["Fatigued", 17, "bg-amber-500"]
            ].map(([label, percentage, colorBg]) => (
              <div key={String(label)}>
                <div className="mb-2 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{String(label)}</span>
                  <span>{String(percentage)}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-3 rounded-full ${String(colorBg)} transition-all duration-500`} style={{ width: `${String(percentage)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge variant="emerald">Monthly Overview</Badge>
            <Badge variant="teal">Mood Stability: High</Badge>
            <Badge variant="sky" className="font-semibold">Confidence 94%</Badge>
          </div>
        </Card>
      </div>
    </PageMotion>
  );
}
