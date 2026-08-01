import { motion } from "motion/react";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { themes, weeklyInsights } from "@/components/app/data";

const toneMap: Record<string, string> = {
  accent: "var(--color-accent)",
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  border: "var(--color-border)",
};

/** Weekly insights — written like a letter with numbers, not a KPI grid. */
export function WeeklyInsights() {
  return (
    <AppFrame
      active="reflections"
      title="Your week, 2–8 February"
      subtitle="Six entries · 1,284 words · read time 4 minutes"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          {weeklyInsights.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: i * 0.15, ease: EASE }}
              className="flex items-start gap-5 rounded-2xl border border-border/70 bg-paper p-5 card-lift"
            >
              <span className="font-display text-3xl leading-none text-primary">
                {w.stat}
              </span>
              <span>
                <span className="block text-[0.9rem] leading-snug">{w.label}</span>
                <span className="mt-1.5 block text-[0.76rem] leading-relaxed text-muted-foreground">
                  {w.detail}
                </span>
              </span>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface-warm p-5 sm:p-6">
          <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
            What you wrote about
          </p>
          <ul className="mt-5 space-y-4">
            {themes.map((t, i) => (
              <li key={t.name}>
                <div className="flex items-baseline justify-between text-[0.82rem]">
                  <span>{t.name}</span>
                  <span className="text-muted-foreground">{t.share}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: toneMap[t.tone] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${t.share}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, delay: 0.3 + i * 0.12, ease: EASE }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-7 border-t border-border/70 pt-5 font-display text-[0.98rem] leading-relaxed italic text-foreground/85">
            “Work took the most words this week, but family changed your mood the
            most.”
          </p>
        </div>
      </div>
    </AppFrame>
  );
}
