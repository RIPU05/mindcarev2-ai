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
    <div
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-24 pt-28 sm:px-10"
    >
      <motion.div style={{ y, opacity }} className="mx-auto w-full max-w-3xl">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-muted-foreground"
        >
          Thursday · 9:42 pm
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.15, ease: EASE }}
          className="mt-6 font-display text-4xl leading-[1.08] sm:text-6xl"
        >
          Good evening.
          <span className="block italic text-primary">How are you feeling today?</span>
        </motion.h1>

        <motion.div
          ref={paperRef}
          initial={{ opacity: 0, y: 30, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.6, delay: 0.4, ease: EASE }}
          className="mt-12 rounded-[26px] border border-border bg-paper p-7 shadow-panel sm:p-10"
        >
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <span className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
              Entry no. 148
            </span>
            <span className="text-[0.68rem] tracking-wide text-muted-foreground">
              Private
            </span>
          </div>

          <p className="mt-7 min-h-[6.5rem] font-display text-xl leading-[2.1rem] text-foreground/90 sm:min-h-[7rem] sm:text-2xl sm:leading-[2.6rem]">
            {typed}
            <Caret />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/70 pt-6">
            <Button variant="solid" size="pill" asChild>
              <a href="#begin">Begin writing</a>
            </Button>
            <span className="text-xs text-muted-foreground">
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
    </div>
  );
}
