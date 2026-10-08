import { ArrowRight, Calendar, FileText, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { journalEntries, monthlyMood, weeklyMood } from "@/lib/mock/app-data";
import type { JournalResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  action
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon
}: {
  label: string;
  value: string;
  helper: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="glass-card relative overflow-hidden p-5 border-stone-200/70 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          {label}
        </p>
        {Icon && (
          <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300">
            <Icon className="size-4.5" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
        {value}
      </div>
      <p className="mt-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {helper}
      </p>
    </Card>
  );
}

export function TrendCard() {
  return (
    <Card className="min-h-72">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Weekly Mood Rhythm</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">7-day emotional velocity & stability</p>
        </div>
        <Badge variant="emerald">7 Days</Badge>
      </div>
      <div className="flex h-44 items-end gap-3 pt-4">
        {weeklyMood.map((item) => (
          <div key={item.day} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full rounded-t-xl bg-slate-100 dark:bg-slate-800 overflow-hidden h-36 flex items-end">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-300"
                style={{ height: `${item.mood}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.day}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MoodCalendar() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Check-in Map</h3>
          <p className="text-xs text-slate-500">Monthly check-in density</p>
        </div>
        <Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="grid grid-cols-10 gap-2">
        {monthlyMood.map((day) => (
          <div
            key={day.day}
            className={cn(
              "aspect-square rounded-lg border text-center text-[10px] font-bold leading-7 transition-all duration-200 hover:scale-110 cursor-pointer",
              day.value > 78
                ? "border-emerald-300 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 dark:border-emerald-700"
                : day.value > 68
                ? "border-teal-300 bg-teal-400 text-slate-950 dark:border-teal-700"
                : "border-amber-200 bg-amber-200/70 text-amber-950 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            )}
            title={`Day ${day.day}: Score ${day.value}`}
          >
            {day.day}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function JournalList({ entries }: { entries?: JournalResponse[] }) {
  const list =
    entries?.map((entry) => ({
      id: entry.id,
      title: entry.title ?? "Reflection Entry",
      date: new Date(entry.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      source: entry.source || "manual",
      excerpt: entry.content,
      tags: entry.tags && entry.tags.length ? entry.tags : ["reflection"],
      words: entry.content.split(/\s+/).filter(Boolean).length
    })) ??
    journalEntries.map((entry) => ({
      ...entry,
      source: "manual"
    }));

  return (
    <div className="space-y-4">
      {list.map((entry) => (
        <Link key={entry.id} href={`/journal/${entry.id}`} className="block">
          <Card className="glass-card border border-slate-200/80 hover:border-emerald-500/40 dark:border-slate-800 dark:hover:border-emerald-500/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base dark:text-slate-100">{entry.title}</h3>
                  <Badge variant="emerald" className="uppercase text-[10px]">
                    {entry.source}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2 dark:text-slate-300">
                  {entry.excerpt}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="sky" className="text-[11px]">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs font-semibold text-slate-400 sm:shrink-0">
                <div>{entry.date}</div>
                <div className="mt-1 text-emerald-600 dark:text-emerald-400">{entry.words} words</div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
  icon: Icon = FileText
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="grid min-h-64 place-items-center text-center p-8 border-dashed border-stone-300/80 dark:border-stone-800">
      <div className="flex flex-col items-center">
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-400">
          <Icon className="size-7" />
        </div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed dark:text-slate-400">{detail}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}

export function LoadingPanel() {
  return (
    <Card className="space-y-4 p-6">
      <Skeleton className="h-6 w-48 rounded-xl bg-slate-200/80 dark:bg-slate-800/80" />
      <Skeleton className="h-28 w-full rounded-2xl bg-slate-100 dark:bg-slate-850" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </Card>
  );
}

export function QuickActions() {
  return (
    <Card>
      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Quick Actions</h3>
      <p className="text-xs text-slate-500 mb-4">Serene check-in shortcuts</p>
      <div className="grid gap-3">
        <Link href="/journal/new">
          <Button className="w-full justify-between py-6">
            <span>New Reflection</span> <Plus className="size-4" />
          </Button>
        </Link>
        <Link href="/mood-history">
          <Button variant="secondary" className="w-full justify-between py-6">
            <span>Log Check-in</span> <ArrowRight className="size-4 text-emerald-600" />
          </Button>
        </Link>
        <Link href="/assistant">
          <Button variant="outline" className="w-full justify-between py-6">
            <span>Ask AI Assistant</span> <Sparkles className="size-4 text-emerald-500" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function SearchFilters() {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
        <Input className="pl-10 h-11 rounded-xl" placeholder="Search entries, keywords, topics..." />
      </div>
      <Button variant="secondary" className="h-11">
        All Sources
      </Button>
      <Button variant="secondary" className="h-11">
        Sort by Date
      </Button>
    </div>
  );
}
