import { motion } from "motion/react";
import { useMoodHistory, useJournals } from "@/hooks/useApi";
import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { moodMeta } from "@/components/app/data";

const W = 640;
const H = 190;

const moodValues: Record<string, number> = {
  low: 1,
  flat: 3,
  steady: 5,
  warm: 7,
  bright: 9,
};

export function MoodTimeline() {
  const { data: moodHistory } = useMoodHistory(14);
  const { data: journals } = useJournals(10);

  // Fallback / mock data if no items exist in backend yet
  const items = moodHistory?.items && moodHistory.items.length > 0
    ? [...moodHistory.items].reverse() // show oldest to newest
    : [
        { primary_mood: "low", created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString() },
        { primary_mood: "flat", created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
        { primary_mood: "steady", created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
        { primary_mood: "steady", created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
        { primary_mood: "warm", created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
        { primary_mood: "bright", created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
      ];

  const getPoints = () => {
    const step = W / Math.max(1, items.length - 1);
    return items.map((d, i) => {
      const moodKey = (d.primary_mood || "steady") as keyof typeof moodMeta;
      const numericVal = moodValues[moodKey] || 5;
      return {
        x: i * step,
        y: H - ((numericVal - 1) / 8) * (H - 24) - 12,
        mood: moodKey,
      };
    });
  };

  const pts = getPoints();
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  // Map journal entries to the timeline list
  const journalTimeline = journals?.items && journals.items.length > 0
    ? journals.items.map((j) => ({
        date: new Date(j.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        title: j.title || "Untitled Reflection",
        excerpt: j.content.slice(0, 100) + (j.content.length > 100 ? "..." : ""),
        mood: (j.tags.find(t => bands.includes(t as any)) || "steady") as keyof typeof moodMeta,
      }))
    : [
        { date: "8 Feb", title: "Quiet evening", excerpt: "A walk down the canal path, cold wind...", mood: "steady" as const },
        { date: "6 Feb", title: "Canal walk", excerpt: "Feeling stable after a long busy week...", mood: "warm" as const },
      ];

  const bands = ["low", "flat", "steady", "warm", "bright"] as const;

  return (
    <AppFrame
      active="timeline"
      title={`Mood over the last ${items.length} entries`}
      subtitle="Visual mood timeline from your journal records"
      action={
        <div className="flex gap-1 rounded-full bg-muted p-0.5 text-[0.68rem]">
          {["History", "Overview"].map((t, i) => (
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
      <div className="rounded-2xl bg-paper p-5 sm:p-7 border border-border/70">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-48 w-full overflow-visible sm:h-56"
          role="img"
          aria-label="Mood timeline chart"
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

          {pts.length > 1 && (
            <>
              <motion.path
                d={area}
                fill="url(#moodFill)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, delay: 0.2, ease: EASE }}
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
            </>
          )}

          {pts.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === pts.length - 1 ? 5 : 3}
              fill={moodMeta[p.mood]?.token || "var(--color-primary)"}
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
          <span>{items.length > 0 ? new Date(items[0].created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "Start"}</span>
          <span>Timeline Grid</span>
          <span>{items.length > 0 ? new Date(items[items.length - 1].created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "End"}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {journalTimeline.map((t, i) => (
          <motion.div
            key={t.title + i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.1, ease: EASE }}
            className="flex gap-3 rounded-2xl border border-border/70 bg-surface p-4 card-lift"
          >
            <span
              aria-hidden
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ background: moodMeta[t.mood]?.token || "var(--color-primary)" }}
            />
            <span className="min-w-0">
              <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                {t.date} · {moodMeta[t.mood]?.label || "steady"}
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
