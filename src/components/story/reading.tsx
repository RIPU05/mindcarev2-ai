import { motion } from "motion/react";

import { Chapter, EASE, FadeIn } from "@/components/story/primitives";

type Fragment = { text: string; mark?: boolean; note?: string };

const fragments: Fragment[] = [
  { text: "Third late night " },
  { text: "this week", mark: true, note: "You've mentioned this three times in nine days." },
  { text: ". I told myself it was the deadline, but honestly I think I keep working because " },
  { text: "the flat is too quiet", mark: true, note: "This feeling appears several times after 9 pm." },
  { text: " after nine. Called mum for eleven minutes and " },
  { text: "felt better immediately", mark: true, note: "I've noticed connection shifts your evenings." },
  { text: "." },
];

export function Reading() {
  return (
    <Chapter id="reading" index="II" label="Being read">
      <div className="max-w-3xl">
        <FadeIn>
          <h2 className="font-display text-3xl leading-[1.14] sm:text-[2.6rem]">
            Then something reads it back —
            <span className="italic text-primary"> properly.</span>
          </h2>
        </FadeIn>
      </div>

      <div className="mt-20 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <FadeIn delay={0.1}>
          <p className="font-display text-xl leading-[2.3rem] text-foreground/85 sm:text-[1.5rem] sm:leading-[2.9rem]">
            {fragments.map((f, i) =>
              f.mark ? (
                <span key={i} className="relative inline">
                  <motion.span
                    aria-hidden
                    className="absolute inset-x-0 bottom-[0.1em] -z-10 h-[0.85em] origin-left rounded-[3px] bg-accent-soft"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: "-15% 0px" }}
                    transition={{ duration: 1.1, delay: 0.5 + i * 0.28, ease: EASE }}
                  />
                  <span className="relative">{f.text}</span>
                </span>
              ) : (
                <span key={i}>{f.text}</span>
              ),
            )}
          </p>
        </FadeIn>

        <ul className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          {fragments
            .filter((f) => f.note)
            .map((f, i) => (
              <motion.li
                key={f.note}
                initial={{ opacity: 0, x: 22 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 1.1, delay: 0.9 + i * 0.35, ease: EASE }}
                className="relative rounded-2xl border border-border bg-card p-5 shadow-soft card-lift"
              >
                <span
                  aria-hidden
                  className="absolute -left-3 top-7 hidden h-px w-6 bg-border lg:block"
                />
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Noticed
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                  “{f.note}”
                </p>
              </motion.li>
            ))}
        </ul>
      </div>
    </Chapter>
  );
}
