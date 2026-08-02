import { motion } from "motion/react";

import { Chapter, FadeIn, EASE, Parallax } from "@/components/story/primitives";


const blobs = [
  { label: "Tired", x: 26, y: 34, r: 21, color: "var(--color-primary)", o: 0.5 },
  { label: "Lonely", x: 58, y: 26, r: 15, color: "var(--color-accent)", o: 0.42 },
  { label: "Relieved", x: 70, y: 58, r: 18, color: "var(--color-secondary)", o: 0.55 },
  { label: "Driven", x: 38, y: 68, r: 13, color: "var(--color-primary)", o: 0.3 },
  { label: "Steady", x: 84, y: 40, r: 9, color: "var(--color-secondary)", o: 0.35 },
];

export function Emotions() {
  return (
    <Chapter id="emotions" index="III" label="Emotion map" tone="paper">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">

          <FadeIn>
            <ChapterTitle>
              Words become
              <span className="italic text-accent"> colour.</span>
            </ChapterTitle>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              Not a score out of ten. A soft field of everything that moved
              through the evening, sized by how loudly it appeared.
            </p>
          </FadeIn>

          <ul className="mt-10 space-y-4">
            {blobs.map((b, i) => (
              <motion.li
                key={b.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: EASE }}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: b.color, opacity: b.o + 0.35 }}
                />
                <span className="text-foreground/80">{b.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {Math.round(b.r * 3.4)}%
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <FadeIn delay={0.15}>
          <Parallax distance={34}>
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-border bg-surface shadow-panel card-lift">

            <svg
              viewBox="0 0 100 100"
              className="size-full"
              role="img"
              aria-label="Soft organic map of the emotions found in this entry"
            >
              <defs>
                <filter id="soften">
                  <feGaussianBlur stdDeviation="3.2" />
                </filter>
              </defs>
              <g filter="url(#soften)">
                {blobs.map((b, i) => (
                  <motion.circle
                    key={b.label}
                    cx={b.x}
                    cy={b.y}
                    r={b.r}
                    fill={b.color}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: b.o }}
                    viewport={{ once: true }}
                    style={{ transformOrigin: `${b.x}px ${b.y}px` }}
                    transition={{ duration: 2.2, delay: i * 0.22, ease: EASE }}
                  />
                ))}
              </g>
              {blobs.map((b, i) => (
                <motion.text
                  key={`${b.label}-t`}
                  x={b.x}
                  y={b.y}
                  textAnchor="middle"
                  className="fill-foreground/70"
                  style={{ fontSize: 3.4, letterSpacing: 0.2 }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.9 + i * 0.2 }}
                >
                  {b.label}
                </motion.text>
              ))}
            </svg>
          </div>
          </Parallax>
        </FadeIn>

      </div>
    </Chapter>
  );
}
