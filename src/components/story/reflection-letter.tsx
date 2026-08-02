import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Chapter, FadeIn, EASE } from "@/components/story/primitives";

const letter = [
  "You noticed something important tonight: the work isn't only about the deadline.",
  "When you wrote about calling your mum, the tone of your entry changed — shorter sentences, less defending yourself. That's the second time this month a small connection has quietly rescued an evening.",
  "Nothing here needs fixing. It might just be worth seeing whether the quiet, rather than the workload, is the thing you're staying late to avoid.",
];

export function ReflectionLetter() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [62, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [0, 1]);

  return (
    <Chapter id="reflection" index="IV" label="The reflection">
      <div ref={ref} className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <FadeIn>
            <ChapterTitle>
              The journal folds away.
              <span className="block italic text-primary">A letter stays.</span>
            </ChapterTitle>
          </FadeIn>
          <motion.div
            aria-hidden
            style={{ rotateX, opacity, transformPerspective: 900 }}
            className="mt-10 h-24 origin-bottom rounded-2xl border border-border bg-paper shadow-soft"
          />
        </div>

        <FadeIn delay={0.1}>
          <article className="rounded-[30px] border border-border bg-card p-8 shadow-panel card-lift sm:p-14">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
              For you · Thursday
            </p>
            <div className="mt-8 space-y-7">
              {letter.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 1.3, delay: 0.25 * i, ease: EASE }}
                  className="font-display text-lg leading-[2rem] text-foreground/90 sm:text-[1.35rem] sm:leading-[2.5rem]"
                >
                  {p}
                </motion.p>
              ))}
            </div>
            <p className="mt-10 border-t border-border pt-6 text-sm italic text-muted-foreground">
              — MindCare, after reading entry 148
            </p>
          </article>
        </FadeIn>
      </div>
    </Chapter>
  );
}
