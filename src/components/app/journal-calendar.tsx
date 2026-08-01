import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { calendarMonth, moodMeta } from "@/components/app/data";

const dow = ["M", "T", "W", "T", "F", "S", "S"];

/** Calendar — each day is a mood dot, drawn in as you scroll. */
export function JournalCalendar() {
  const cells = [
    ...Array.from({ length: calendarMonth.offset }, () => null),
    ...Array.from({ length: calendarMonth.days }, (_, i) => i + 1),
  ];

  return (
    <AppFrame
      active="calendar"
      title={`${calendarMonth.label} ${calendarMonth.year}`}
      subtitle="23 entries · longest run 11 days · 2 days missed"
      action={
        <span className="flex items-center gap-2 text-muted-foreground">
          <ChevronLeft aria-hidden className="size-4" strokeWidth={1.6} />
          <ChevronRight aria-hidden className="size-4" strokeWidth={1.6} />
        </span>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="rounded-2xl bg-paper p-5 sm:p-6">
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
                  className="relative grid aspect-square place-items-center rounded-xl text-[0.72rem]"
                  style={{
                    background: calendarMonth.written[day]
                      ? `color-mix(in oklab, ${moodMeta[calendarMonth.written[day]!].token} 26%, var(--color-surface))`
                      : "var(--color-surface)",
                    boxShadow:
                      day === calendarMonth.today
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
              Thursday 6 February
            </p>
            <p className="mt-3 font-display text-lg">Thursday, quiet underneath</p>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted-foreground">
              214 words, written at 9:42 pm. Marked steady. Reflection kept.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface p-5 card-lift">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Pattern
            </p>
            <p className="mt-3 font-display text-[1.02rem] leading-relaxed">
              You skip Wednesdays. Four missed in a row — that's the night you
              work late.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-primary-soft p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-primary/70">
              Gentle reminder
            </p>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-primary">
              Writing is set for 21:30. Change it any time — missing a day costs
              you nothing here.
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
