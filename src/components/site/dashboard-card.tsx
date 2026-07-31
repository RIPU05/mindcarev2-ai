import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const moodPoints = [42, 48, 40, 55, 62, 58, 71, 68, 76, 74, 82, 79];

function sparkPath(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / (max - min || 1)) * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function DashboardCard({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "compact";
}) {
  const path = sparkPath(moodPoints, 320, 96);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border bg-card shadow-panel",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-secondary" aria-hidden />
          <p className="text-sm font-medium">Your week</p>
        </div>
        <p className="text-xs text-muted-foreground">Mon — Sun</p>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface-warm p-5">
          <p className="eyebrow">Mood balance</p>
          <p className="mt-3 font-display text-3xl">7.4</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Steadier than last week
          </p>
          <svg
            viewBox="0 0 320 96"
            className="mt-4 h-16 w-full"
            role="img"
            aria-label="Mood trend rising gently over the past twelve days"
          >
            <motion.path
              d={path}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </svg>
        </div>

        <div className="rounded-2xl bg-surface-warm p-5">
          <p className="eyebrow">Emotions noticed</p>
          <ul className="mt-4 space-y-3">
            {[
              { label: "Calm", value: 68 },
              { label: "Hopeful", value: 54 },
              { label: "Restless", value: 31 },
              { label: "Tired", value: 22 },
            ].map((row, i) => (
              <li key={row.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{row.label}</span>
                  <span className="text-muted-foreground">{row.value}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      i % 2 === 0 ? "bg-primary" : "bg-secondary",
                    )}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${row.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.15 * i, ease: "easeOut" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {variant === "full" ? (
          <>
            <div className="rounded-2xl bg-surface-warm p-5 sm:col-span-2">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">Entries this month</p>
                <p className="text-xs text-muted-foreground">18 of 30 days</p>
              </div>
              <div className="mt-4 grid grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.015 }}
                    className={cn(
                      "aspect-square rounded-[5px]",
                      [2, 5, 6, 9, 12, 13, 16, 19, 22, 25, 26, 29].includes(i)
                        ? "bg-primary/85"
                        : i % 3 === 0
                          ? "bg-secondary/60"
                          : "bg-border",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5 sm:col-span-2">
              <p className="eyebrow">Journal insight</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                “Your calmest entries this week came after evenings without
                screens. Sunday mornings show up again as your steadiest time.”
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
