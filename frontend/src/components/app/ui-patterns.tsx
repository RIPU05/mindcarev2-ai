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

export function PageHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-medium text-stone-500">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card>
      <p className="text-sm text-stone-500">{label}</p>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm text-stone-500">{helper}</p>
    </Card>
  );
}

export function TrendCard() {
  return (
    <Card className="min-h-72">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Weekly mood trend</h3>
          <p className="text-sm text-stone-500">A gentle lift toward the weekend</p>
        </div>
        <Badge>7 days</Badge>
      </div>
      <div className="flex h-40 items-end gap-3">
        {weeklyMood.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-lg bg-emerald-200 transition hover:bg-emerald-300 dark:bg-emerald-700" style={{ height: `${item.mood}%` }} />
            <span className="text-xs text-stone-500">{item.day}</span>
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
        <h3 className="font-semibold">Mood calendar</h3>
        <Calendar className="size-5 text-stone-400" />
      </div>
      <div className="grid grid-cols-10 gap-2">
        {monthlyMood.map((day) => (
          <div
            key={day.day}
            className={cn(
              "aspect-square rounded-md border border-white text-center text-[10px] leading-7 text-stone-600 dark:border-stone-950 dark:text-stone-200",
              day.value > 78 ? "bg-emerald-300" : day.value > 68 ? "bg-sky-200" : "bg-amber-100"
            )}
            title={`Day ${day.day}: ${day.value}`}
          >
            {day.day}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function JournalList({ entries }: { entries?: JournalResponse[] }) {
  const list = entries?.map((entry) => ({
    id: entry.id,
    title: entry.title ?? "Untitled entry",
    date: new Date(entry.created_at).toLocaleDateString(),
    mood: "Journal",
    excerpt: entry.content,
    tags: entry.tags,
    words: entry.content.split(/\s+/).filter(Boolean).length
  })) ?? journalEntries;

  return (
    <div className="space-y-3">
      {list.map((entry) => (
        <Link key={entry.id} href={`/journal/${entry.id}`}>
          <Card className="transition hover:border-stone-300 hover:shadow-lg dark:hover:border-stone-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{entry.title}</h3>
                  <Badge>{entry.mood}</Badge>
                </div>
                <p className="mt-2 text-sm text-stone-500">{entry.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs text-stone-500">
                <div>{entry.date}</div>
                <div className="mt-1">{entry.words} words</div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="grid min-h-64 place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-lg bg-stone-100 dark:bg-stone-900">
          <FileText className="size-6 text-stone-400" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-stone-500">{detail}</p>
      </div>
    </Card>
  );
}

export function LoadingPanel() {
  return (
    <Card className="space-y-4">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </Card>
  );
}

export function QuickActions() {
  return (
    <Card>
      <h3 className="font-semibold">Quick actions</h3>
      <div className="mt-4 grid gap-3">
        <Link href="/journal/new"><Button className="w-full justify-between">New journal <Plus className="size-4" /></Button></Link>
        <Button variant="secondary" className="w-full justify-between">Mood check-in <ArrowRight className="size-4" /></Button>
        <Button variant="secondary" className="w-full justify-between">Ask assistant <Sparkles className="size-4" /></Button>
      </div>
    </Card>
  );
}

export function SearchFilters() {
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-stone-400" />
        <Input className="pl-9" placeholder="Search entries" />
      </div>
      <Button variant="secondary">Mood</Button>
      <Button variant="secondary">Date</Button>
    </div>
  );
}
