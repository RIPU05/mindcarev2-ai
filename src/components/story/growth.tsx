import { motion } from "motion/react";

import { Chapter, FadeIn, EASE } from "@/components/story/primitives";
import { cn } from "@/lib/utils";

const mood = [42, 48, 40, 55, 51, 62, 58, 71, 66, 76, 74, 82, 79, 86];

function moodPath(values: number[], w: number, h: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const step = w / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min || 1)) * (h - 10) - 5;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const written = [1, 2, 4, 5, 8, 9, 10, 12, 15, 16, 17, 19, 22, 23, 25, 26, 27, 29];

export function Growth() {
  return (
    <Chapter id="growth" index="V" label="Over time" tone="paper">
      <div className="max-w-2xl">
        <FadeIn>
          <h2 className="font-display text-3xl leading-[1.14] sm:text-[2.6rem]">
            One entry is a night.
            <span className="block italic text-primary">
              Ninety are a pattern.
            </span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Nothing to beat, nothing to optimise. Just the shape your months
            actually made.
          </p>
        </FadeIn>
      </div>

      <div className="mt-20 grid gap-6 md:grid-cols-3">
        <FadeIn className="md:col-span-2">
          <div className="h-full rounded-[26px] border border-border bg-surface p-7 shadow-soft card-lift sm:p-9">
            <div className="flex items-baseline justify-between">
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                Mood, last fourteen entries
              </p>
              <p className="font-display text-2xl">7.4</p>
            </div>
            <svg
              viewBox="0 0 400 120"
              className="mt-8 h-32 w-full"
              role="img"
              aria-label="Mood rising gently across the last fourteen entries"
            >
              <motion.path
                d={moodPath(mood, 400, 120)}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2.6, ease: EASE }}
              />
            </svg>
            <p className="mt-4 text-sm text-muted-foreground">
              Steadier evenings since you started writing before bed rather than
              after midnight.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="h-full rounded-[26px] border border-border bg-surface p-7 shadow-soft card-lift">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
              This month
            </p>
            <p className="mt-4 font-display text-5xl">18</p>
            <p className="mt-1 text-sm text-muted-foreground">days written</p>
            <div className="mt-7 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.02, ease: EASE }}
                  className={cn(
                    "aspect-square rounded-[5px]",
                    written.includes(i)
                      ? "bg-primary/80"
                      : i % 4 === 0
                        ? "bg-secondary/45"
                        : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        {[
          { k: "Calmest hour", v: "Sunday, 8 am" },
          { k: "Recurring theme", v: "Quiet evenings" },
          { k: "Longest run", v: "11 days" },
        ].map((item, i) => (
          <FadeIn key={item.k} delay={0.05 * i}>
            <div className="rounded-[26px] border border-border bg-surface p-7 shadow-soft card-lift">
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                {item.k}
              </p>
              <p className="mt-4 font-display text-2xl">{item.v}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </Chapter>
  );
}
