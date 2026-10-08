"use client";

import { Activity, Heart, NotebookPen, Sparkles, Shield, Smile, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CardMotion, PageMotion } from "@/components/app/motion";
import {
  JournalList,
  LoadingPanel,
  MoodCalendar,
  PageHeader,
  QuickActions,
  StatCard,
  TrendCard
} from "@/components/app/ui-patterns";
import { InlineError } from "@/components/app/api-states";
import { useDashboard, useJournalEntries, useMoodHistory } from "@/lib/api/hooks";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const journals = useJournalEntries();
  const moods = useMoodHistory();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Friend";

  const riskLevel = dashboard.data?.risk_level ?? "unknown";
  const riskBadgeVariant =
    riskLevel === "low"
      ? "emerald"
      : riskLevel === "moderate"
      ? "amber"
      : riskLevel === "high" || riskLevel === "crisis"
      ? "rose"
      : "default";

  return (
    <PageMotion>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        eyebrow="A calm space to understand your well-being"
      />

      {dashboard.isLoading ? (
        <LoadingPanel />
      ) : dashboard.isError ? (
        <InlineError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : null}

      {/* Hero Welcome Banner */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 p-8 text-white shadow-xl shadow-emerald-500/15 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-60 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="size-3.5" /> MindCare AI Reflection Engine
          </div>
          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl tracking-tight">
            How are you feeling today?
          </h2>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed sm:text-base">
            Take a moment for a quiet check-in or write down what feels true right now. Your AI companion is ready to listen and provide gentle guidance.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <CardMotion>
          <StatCard
            label="Today's Mood"
            value={dashboard.data?.latest_mood ?? "Not logged"}
            helper={`Risk Status: ${riskLevel}`}
            icon={Smile}
          />
        </CardMotion>

        <CardMotion>
          <StatCard
            label="Journal Entries"
            value={String(dashboard.data?.journal_count ?? 0)}
            helper="Reflections logged in backend"
            icon={BookOpen}
          />
        </CardMotion>

        <CardMotion>
          <StatCard
            label="Risk Status"
            value={riskLevel.toUpperCase()}
            helper="AI Safety Assessment"
            icon={Shield}
          />
        </CardMotion>

        <CardMotion>
          <StatCard
            label="Check-ins"
            value={String(dashboard.data?.mood_count ?? 0)}
            helper="Total check-ins recorded"
            icon={Activity}
          />
        </CardMotion>
      </div>

      {/* Rhythm & Quick Actions */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <TrendCard />
        <QuickActions />
      </div>

      {/* Journal Entries & Calendar Grid */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card className="flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <NotebookPen className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Recent Reflections</h3>
            </div>
            <Badge variant="emerald">Live API</Badge>
          </div>
          {journals.isError ? (
            <InlineError error={journals.error} onRetry={() => journals.refetch()} />
          ) : journals.isLoading ? (
            <LoadingPanel />
          ) : (
            <JournalList entries={journals.data?.items} />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-emerald-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">AI MindCare Insight</h3>
              </div>
              <Badge variant={riskBadgeVariant}>Risk: {riskLevel}</Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Your calmer journal entries cluster around morning check-ins with clear priorities. Writing regularly helps maintain emotional clarity and reduces stress patterns.
            </p>
          </Card>

          {moods.isError ? (
            <InlineError error={moods.error} onRetry={() => moods.refetch()} />
          ) : (
            <MoodCalendar />
          )}
        </div>
      </div>

      {/* Three Pillars */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          [Heart, "Self-Kindness", "Language analysis shows gentle tone in recent writing."],
          [Activity, "Emotional Rhythm", "Check-ins indicate steady evening stability."],
          [Sparkles, "AI Intelligence", "Regular entries improve personalized companion responses."]
        ].map(([Icon, title, text]) => (
          <Card key={String(title)} className="glass-card">
            <Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">{String(title)}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{String(text)}</p>
          </Card>
        ))}
      </div>
    </PageMotion>
  );
}
