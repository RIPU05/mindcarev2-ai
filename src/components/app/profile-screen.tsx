import { motion } from "motion/react";
import { Download, Feather, Flame, Moon } from "lucide-react";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { moodMeta, user } from "@/components/app/data";

const stats = [
  { icon: Feather, k: "Entries", v: "148" },
  { icon: Flame, k: "Current run", v: "11 days" },
  { icon: Moon, k: "Usual hour", v: "21:40" },
];

const values = [
  { label: "Being honest with myself", since: "since Mar 2024" },
  { label: "Sleeping before midnight", since: "since Nov 2024" },
  { label: "Calling home on Sundays", since: "since Jan 2025" },
];

export function ProfileScreen() {
  return (
    <AppFrame
      active="profile"
      title={user.name}
      subtitle={`Writing since ${user.joined} · ${user.timezone}`}
      action={
        <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <Download aria-hidden className="size-3.5" strokeWidth={1.6} /> Export all
          entries
        </span>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="flex items-center gap-4 rounded-2xl bg-paper p-5">
            <span className="grid size-14 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
              {user.initials}
            </span>
            <span>
              <span className="block font-display text-lg">{user.name}</span>
              <span className="mt-0.5 block text-[0.76rem] text-muted-foreground">
                {user.plan}
              </span>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
                  className="rounded-2xl border border-border/70 bg-surface p-4 card-lift"
                >
                  <Icon
                    aria-hidden
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.6}
                  />
                  <p className="mt-3 font-display text-xl">{s.v}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.k}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-surface-warm p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Mood mix, last 90 days
            </p>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full">
              {(
                [
                  ["bright", 18],
                  ["warm", 34],
                  ["steady", 27],
                  ["flat", 14],
                  ["low", 7],
                ] as const
              ).map(([k, pct], i) => (
                <motion.span
                  key={k}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.2 + i * 0.1, ease: EASE }}
                  style={{ background: moodMeta[k].token }}
                />
              ))}
            </div>
            <p className="mt-3 text-[0.75rem] text-muted-foreground">
              More warm evenings than a year ago, and fewer flat ones.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-surface p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              What you're practising
            </p>
            <ul className="mt-4 space-y-3">
              {values.map((v) => (
                <li key={v.label} className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-[1rem]">{v.label}</span>
                  <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                    {v.since}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-paper p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Most used tags
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["work", "family", "sleep", "nina", "running", "money", "flat"].map(
                (t, i) => (
                  <Pill key={t} tone={i < 2 ? "primary" : "muted"}>
                    {t}
                  </Pill>
                ),
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-primary-soft p-5">
            <p className="font-display text-[1rem] leading-relaxed text-primary">
              “You've written on 148 evenings. Nothing is scored, ranked or shared.”
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
