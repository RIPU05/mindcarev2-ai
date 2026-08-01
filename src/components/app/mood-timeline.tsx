import { motion } from "motion/react";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { moodMeta, moodSeries, timeline } from "@/components/app/data";

const W = 640;
const H = 190;

function points() {
  const step = W / (moodSeries.length - 1);
  return moodSeries.map((d, i) => ({
    x: i * step,
    y: H - ((d.value - 3) / 7) * (H - 24) - 12,
    d,
  }));
}

/** Mood timeline — a drawn line, not a chart widget. */
export function MoodTimeline() {
  const pts = points();
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <AppFrame
      active="timeline"
      title="Mood over the last fourteen entries"
      subtitle="24 January – 8 February · average 6.4, rising"
      action={
        <div className="flex gap-1 rounded-full bg-muted p-0.5 text-[0.68rem]">
          {["14 days", "3 months", "Year"].map((t, i) => (
            <span
              key={t}
              className={
                i === 0
                  ? "rounded-full bg-surface px-2.5 py-1 text-foreground shadow-soft"
                  : "px-2.5 py-1 text-muted-foreground"
              }
            >
              {t}
            </span>
          ))}
        </div>
      }
    >
      <div className="rounded-2xl bg-paper p-5 sm:p-7">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-48 w-full overflow-visible sm:h-56"
          role="img"
          aria-label="Mood rising gently from 4.2 to 8.6 across fourteen entries"
        >
          <defs>
            <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1="0"
              x2={W}
              y1={H * g}
              y2={H * g}
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          ))}

          <motion.path
            d={area}
            fill="url(#moodFill)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, delay: 1.2, ease: EASE }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.8, ease: EASE }}
          />
          {pts.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === pts.length - 1 ? 5 : 3}
              fill={moodMeta[p.d.mood].token}
              stroke="var(--color-surface)"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.13, ease: EASE }}
            />
          ))}
        </svg>

        <div className="mt-4 flex justify-between text-[0.66rem] text-muted-foreground">
          <span>24 Jan</span>
          <span>31 Jan</span>
          <span>8 Feb</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {timeline.map((t, i) => (
          <motion.div
            key={t.date}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.1, ease: EASE }}
            className="flex gap-3 rounded-2xl border border-border/70 bg-surface p-4 card-lift"
          >
            <span
              aria-hidden
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ background: moodMeta[t.mood].token }}
            />
            <span className="min-w-0">
              <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                {t.date} · {moodMeta[t.mood].label}
              </span>
              <span className="mt-1 block truncate font-display text-[0.98rem]">
                {t.title}
              </span>
              <span className="mt-1 block truncate text-[0.75rem] text-muted-foreground">
                {t.excerpt}
              </span>
            </span>
          </motion.div>
        ))}
      </div>
    </AppFrame>
  );
}
