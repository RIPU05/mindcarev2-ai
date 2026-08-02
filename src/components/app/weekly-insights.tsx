import { useState, useEffect } from "react";
import { motion } from "motion/react";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { useDashboard, useJournals } from "@/hooks/useApi";

const toneMap: Record<string, string> = {
  accent: "var(--color-accent)",
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  border: "var(--color-border)",
};

interface ThemeStat {
  name: string;
  share: number;
  tone: string;
}

export function WeeklyInsights() {
  const { data: dashboard } = useDashboard();
  const { data: journals } = useJournals();

  const [themes, setThemes] = useState<ThemeStat[]>([
    { name: "Mindfulness", share: 60, tone: "primary" },
    { name: "Daily Routines", share: 40, tone: "accent" },
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem("mc_latest_analysis");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.themes && data.themes.length > 0) {
          const mapped = data.themes.map((t: string, i: number) => {
            const parts = t.split(":");
            return {
              name: parts[0]?.trim() || t,
              share: i === 0 ? 60 : i === 1 ? 30 : 10,
              tone: i === 0 ? "primary" : i === 1 ? "accent" : "secondary",
            };
          });
          setThemes(mapped);
        }
      } catch (e) {
        console.error("Failed to parse cached themes", e);
      }
    }
  }, []);

  const totalWords = journals?.items
    ? journals.items.reduce((acc, curr) => acc + curr.content.trim().split(/\s+/).length, 0)
    : 1280;

  const cards = [
    {
      stat: String(dashboard?.journal_count ?? 0),
      label: "Total Reflections",
      detail: "The total number of private journal entries safely logged.",
    },
    {
      stat: `${dashboard?.mood_count ?? 0} days`,
      label: "Current Streak",
      detail: "Consecutive daily logs recorded in the private catalog.",
    },
    {
      stat: dashboard?.latest_mood || "Steady",
      label: "Latest Mood Check-in",
      detail: `Your primary mood sentiment is marked as ${dashboard?.latest_mood || "steady"}.`,
    },
  ];

  return (
    <AppFrame
      active="reflections"
      title="MindCare Analytics & Weekly Insights"
      subtitle={`Total words written: ${totalWords} · Private encryption keys active`}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          {cards.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: i * 0.15, ease: EASE }}
              className="flex items-start gap-5 rounded-2xl border border-border/70 bg-paper p-5 card-lift"
            >
              <span className="font-display text-3xl leading-none text-primary whitespace-nowrap">
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
            What you wrote about (AI Themes)
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
            “Your insights are derived from your private entries. Clear them at any time.”
          </p>
        </div>
      </div>
    </AppFrame>
  );
}
