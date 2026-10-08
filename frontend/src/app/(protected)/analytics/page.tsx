"use client";

import { useState } from "react";
import { Sparkles, BarChart3, Activity, Shield, Heart, Send } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { PageHeader, StatCard, TrendCard } from "@/components/app/ui-patterns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineError, SectionSkeleton } from "@/components/app/api-states";
import { useDashboard, useMoodHistory, useTextAnalysis } from "@/lib/api/hooks";

export default function AnalyticsPage() {
  const dashboard = useDashboard();
  const moods = useMoodHistory();

  const [sampleText, setSampleText] = useState("");
  const textAnalysis = useTextAnalysis();

  function handleAnalyzeText() {
    if (!sampleText.trim()) return;
    textAnalysis.mutate({ text: sampleText.trim() });
  }

  return (
    <PageMotion>
      <PageHeader
        title="Analytics & AI Insights"
        eyebrow="A measured overview of writing patterns, mood velocity, and risk indicators"
      />

      {dashboard.isLoading || moods.isLoading ? <SectionSkeleton /> : null}
      {dashboard.isError ? (
        <InlineError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : null}

      {/* Metrics Row */}
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          label="Latest Mood Score"
          value={dashboard.data?.latest_mood ?? "Not logged"}
          helper="Backend latest status"
          icon={Activity}
        />
        <StatCard
          label="Reflections Tracked"
          value={String(dashboard.data?.journal_count ?? 0)}
          helper="Journal summary entries"
          icon={BarChart3}
        />
        <StatCard
          label="Safety Assessment"
          value={(dashboard.data?.risk_level ?? "unknown").toUpperCase()}
          helper="AI Safety Classification"
          icon={Shield}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TrendCard />

        {/* Theme Frequency */}
        <Card className="glass-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Theme Frequency</h3>
            <Badge variant="teal">Topics</Badge>
          </div>
          <div className="space-y-4">
            {[
              ["Work Boundaries", 42, 84],
              ["Sleep Quality", 36, 72],
              ["Movement & Activity", 28, 56],
              ["Family & Social", 18, 36]
            ].map(([label, val, width]) => (
              <div key={String(label)}>
                <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{String(label)}</span>
                  <span>{String(val)} mentions</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${String(width)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Live Real-time Text Analysis Widget */}
      <Card className="mt-8 glass-card border border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Live AI Emotion Analysis</h3>
            <p className="text-xs text-slate-500">Test Gemini AI sentiment & emotion analysis on custom text</p>
          </div>
        </div>

        {textAnalysis.isError ? (
          <div className="mb-4">
            <InlineError error={textAnalysis.error} onRetry={() => textAnalysis.reset()} />
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Type or paste any reflection sentence (e.g., 'I felt hopeful after my morning walk today')..."
            className="h-12 flex-1 rounded-xl text-sm"
          />
          <Button
            onClick={handleAnalyzeText}
            disabled={textAnalysis.isPending || !sampleText.trim()}
            className="h-12 px-6"
          >
            <Send className="size-4" /> {textAnalysis.isPending ? "Analyzing..." : "Analyze Sentiment"}
          </Button>
        </div>

        {/* Live Analysis Output */}
        {textAnalysis.data ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/90">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Primary Mood</span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 capitalize">
                  {textAnalysis.data.primary_mood}
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Confidence</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {Math.round((textAnalysis.data.confidence || 0) * 100)}%
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Risk Level</span>
                <div className="mt-1">
                  <Badge variant={textAnalysis.data.risk_level === "low" ? "emerald" : "amber"}>
                    {textAnalysis.data.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {textAnalysis.data.emotions && textAnalysis.data.emotions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Emotions Detected:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {textAnalysis.data.emotions.map((emo, idx) => (
                    <Badge key={idx} variant="teal">
                      {emo.label}: {Math.round(emo.score * 100)}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </PageMotion>
  );
}
