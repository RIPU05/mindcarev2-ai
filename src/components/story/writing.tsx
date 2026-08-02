import { motion } from "motion/react";

import { Chapter, EASE, FadeIn } from "@/components/story/primitives";

const paragraphs = [
  "Third late night this week. I told myself it was the deadline, but honestly I think I keep working because the flat is too quiet after nine.",
  "Called mum for eleven minutes. Felt better immediately. Then went straight back to the laptop like nothing happened.",
  "I don't think I'm unhappy. I think I'm just not stopping long enough to find out.",
];

export function Writing() {
  return (
    <Chapter id="writing" index="I" label="The entry" tone="paper">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <FadeIn>
            <ChapterTitle>
              It starts the way every honest thing does —
              <span className="italic text-primary"> slowly.</span>
            </ChapterTitle>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              No prompts to perform for. No streak shouting at you. Just a page
              that waits as long as you need it to.
            </p>
          </FadeIn>
        </div>

        <div className="space-y-8 border-l border-border pl-7 sm:pl-10">
          {paragraphs.map((text, p) => (
            <motion.p
              key={p}
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ staggerChildren: 0.03, delayChildren: p * 0.15 }}
              className="font-display text-xl leading-[2.1rem] text-foreground/90 sm:text-[1.6rem] sm:leading-[2.8rem]"
            >
              {text.split(" ").map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className="inline-block"
                  variants={{
                    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
                    shown: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          ))}

          <FadeIn delay={0.2}>
            <p className="pt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Saved · 11:48 pm
            </p>
          </FadeIn>
        </div>
      </div>
    </Chapter>
  );
}
