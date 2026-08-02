import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Caret, EASE, useTypewriter, useInViewOnce } from "@/components/story/primitives";

const line = "Today was strange. Busy, but quiet underneath it all.";

export function Opening() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { ref: paperRef, inView } = useInViewOnce<HTMLDivElement>("0px");
  const typed = useTypewriter(line, 46, inView);

  return (
    <section
      ref={ref}
      aria-label="Tonight's entry"
      className="relative flex min-h-dvh flex-col justify-center px-5 pb-28 pt-28 sm:px-10 sm:pb-32"
    >
      <motion.div style={{ y, opacity }} className="mx-auto w-full max-w-3xl">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground"
        >
          Thursday · 9:42 pm
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.15, ease: EASE }}
          className="mt-5 font-display text-[2.35rem] leading-[1.06] text-balance-tight sm:mt-6 sm:text-5xl md:text-6xl"
        >
          Good evening.
          <span className="block italic text-primary">How are you feeling today?</span>
        </motion.h1>

        <motion.div
          ref={paperRef}
          initial={{ opacity: 0, y: 30, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.6, delay: 0.4, ease: EASE }}
          className="mt-10 rounded-[24px] border border-border bg-paper p-6 shadow-panel sm:mt-12 sm:rounded-[26px] sm:p-10"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
            <span className="truncate text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Entry no. 148
            </span>
            <span className="shrink-0 text-[0.66rem] tracking-wide text-muted-foreground">
              Private
            </span>
          </div>

          <p className="mt-6 min-h-[7.5rem] font-display text-lg leading-[1.9] text-foreground/90 sm:mt-7 sm:min-h-[7rem] sm:text-2xl sm:leading-[2.6rem]">
            {typed}
            <Caret />
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/70 pt-6 sm:mt-8">
            <Button variant="solid" size="pill" asChild>
              <a href="#begin">Begin writing</a>
            </Button>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Nothing you write here leaves your account.
            </span>
          </div>
        </motion.div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1.2 }}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3"
      >
        <span className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
          Scroll
        </span>
        <motion.span
          aria-hidden
          className="h-10 w-px bg-border"
          animate={{ scaleY: [0.3, 1, 0.3], originY: 0 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>

  );
}
