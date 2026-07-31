import { motion } from "motion/react";

import { Chapter, FadeIn, EASE } from "@/components/story/primitives";

const cards = [
  {
    from: "You",
    text: "I keep saying yes to things I don't want to do.",
  },
  {
    from: "MindCare",
    text: "You wrote something close to this in March. Back then you said yes felt cheaper than explaining. Does that still fit?",
  },
  {
    from: "You",
    text: "Yes. Explaining feels like asking permission.",
  },
  {
    from: "MindCare",
    text: "Then maybe the practice isn't saying no. It's letting an answer stand without a reason attached to it.",
  },
];

export function Assistant() {
  return (
    <Chapter id="assistant" index="VI" label="The conversation">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <FadeIn>
            <h2 className="font-display text-3xl leading-[1.14] sm:text-[2.6rem]">
              It talks like someone
              <span className="italic text-primary"> who remembers.</span>
            </h2>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              No bubbles, no typing dots, no personality act. Just a slow
              exchange you can leave and return to.
            </p>
          </FadeIn>
        </div>

        <div className="space-y-4">
          {cards.map((c, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 1.1, delay: i * 0.12, ease: EASE }}
              className={
                c.from === "You"
                  ? "rounded-[22px] border border-border bg-paper p-6 sm:p-8"
                  : "rounded-[22px] border border-border bg-primary-soft p-6 sm:p-8"
              }
            >
              <p className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
                {c.from}
              </p>
              <p className="mt-4 font-display text-lg leading-[1.85rem] text-foreground/90 sm:text-xl sm:leading-[2.2rem]">
                {c.text}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </Chapter>
  );
}
