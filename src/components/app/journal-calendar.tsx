import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { moodMeta } from "@/components/app/data";
import { useMoodHistory, useJournals } from "@/hooks/useApi";

const dow = ["M", "T", "W", "T", "F", "S", "S"];

export function JournalCalendar() {
  const { data: moodHistory } = useMoodHistory(100);
  const { data: journals } = useJournals(10);

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long" });

  // Get calendar offsets
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Align to Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();

  const cells = [
    ...Array.from({ length: startDayIndex }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Map mood records to their day of the month
  const dayMoodMap: Record<number, string> = {};
  if (moodHistory?.items) {
    moodHistory.items.forEach((item) => {
      const date = new Date(item.created_at);
      if (date.getFullYear() === year && date.getMonth() === month) {
        dayMoodMap[date.getDate()] = item.primary_mood;
      }
    });
  }

  // Retrieve the latest journal entry details for the sidebar
  const latestEntry = journals?.items?.[0];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <AppFrame
      active="calendar"
      title={`${monthLabel} ${year}`}
      subtitle={`${journals?.total ?? 0} total entries recorded`}
      action={
        <span className="flex items-center gap-2 text-muted-foreground select-none">
          <ChevronLeft onClick={handlePrevMonth} aria-hidden className="size-4 cursor-pointer hover:text-foreground" strokeWidth={1.6} />
          <ChevronRight onClick={handleNextMonth} aria-hidden className="size-4 cursor-pointer hover:text-foreground" strokeWidth={1.6} />
        </span>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="rounded-2xl bg-paper p-5 sm:p-6 border border-border/70">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            {dow.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) =>
              day === null ? (
                <span key={`e${i}`} />
              ) : (
                <motion.span
                  key={day}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.018, ease: EASE }}
                  className="relative grid aspect-square place-items-center rounded-xl text-[0.72rem] select-none"
                  style={{
                    background: dayMoodMap[day]
                      ? `color-mix(in oklab, ${moodMeta[dayMoodMap[day] as keyof typeof moodMeta]?.token || 'var(--color-primary)'} 26%, var(--color-surface))`
                      : "var(--color-surface)",
                    boxShadow:
                      day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear()
                        ? "inset 0 0 0 1.5px var(--color-primary)"
                        : "inset 0 0 0 1px var(--color-border)",
                  }}
                >
                  {day}
                </motion.span>
              ),
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-[0.68rem] text-muted-foreground">
            {(["low", "flat", "steady", "warm", "bright"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: moodMeta[k].token }}
                />
                {moodMeta[k].label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-surface-warm p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Most Recent Entry
            </p>
            {latestEntry ? (
              <>
                <p className="mt-3 font-display text-lg">{latestEntry.title || "Untitled draft"}</p>
                <p className="mt-2 text-[0.8rem] leading-relaxed text-muted-foreground">
                  {latestEntry.content.slice(0, 100)}...
                </p>
                <p className="mt-2 text-[0.7rem] text-muted-foreground">
                  Written at {new Date(latestEntry.created_at).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </>
            ) : (
              <p className="mt-3 text-[0.8rem] text-muted-foreground">No entries recorded yet.</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface p-5 card-lift">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Reflection Pattern
            </p>
            <p className="mt-3 font-display text-[1.02rem] leading-relaxed">
              MindCare aggregates your check-in dates. Set a daily reminder in the settings screen to establish a regular journaling habit.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-primary-soft p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-primary/70">
              Gentle reminder
            </p>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-primary">
              Your data is stored privately. Restoring your session preserves all entries and reflections.
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
