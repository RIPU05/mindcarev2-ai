import { motion } from "motion/react";
import { BookMarked, Heart, RefreshCw } from "lucide-react";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { highlights, reflection } from "@/components/app/data";

/** The reflection panel as it appears beside an entry in the product. */
export function ReflectionPanel() {
  return (
    <AppFrame
      active="reflections"
      title={reflection.title}
      subtitle="Written for you at 10:04 pm · from entry 148"
      action={
        <span className="flex items-center gap-3 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <RefreshCw aria-hidden className="size-3.5" strokeWidth={1.6} /> Rewrite
          </span>
          <span className="flex items-center gap-1.5">
            <BookMarked aria-hidden className="size-3.5" strokeWidth={1.6} /> Keep
          </span>
        </span>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl bg-paper p-6 sm:p-8">
          {reflection.body.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 + i * 0.35, ease: EASE }}
              className="mb-5 font-display text-[1.02rem] leading-[1.95rem] text-foreground/90 last:mb-0 sm:text-[1.1rem] sm:leading-[2.1rem]"
            >
              {p}
            </motion.p>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 1.4, ease: EASE }}
            className="mt-7 border-t border-border/70 pt-6"
          >
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              A question to sit with
            </p>
            <p className="mt-3 font-display text-lg italic leading-relaxed text-primary">
              {reflection.question}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill tone="primary">
                <Heart aria-hidden className="size-3" strokeWidth={1.8} /> This landed
              </Pill>
              <Pill>Not quite</Pill>
              <Pill>Write about it</Pill>
            </div>
          </motion.div>
        </article>

        <aside className="space-y-3">
          <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
            What it read
          </p>
          {highlights.map((h, i) => (
            <motion.div
              key={h.phrase}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 + i * 0.25, ease: EASE }}
              className="rounded-2xl border border-border/70 bg-surface-warm p-4"
            >
              <p className="font-display text-[0.95rem] leading-relaxed text-foreground/85">
                <span className="bg-primary-soft px-1 py-0.5">“{h.phrase}”</span>
              </p>
              <p className="mt-2.5 text-[0.72rem] text-muted-foreground">{h.note}</p>
            </motion.div>
          ))}
          <p className="pt-2 text-[0.7rem] text-muted-foreground">
            Drawn from {reflection.sources.join(", ")}.
          </p>
        </aside>
      </div>
    </AppFrame>
  );
}
