import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Caret, EASE } from "@/components/story/primitives";

export function Closing() {
  return (
    <section
      id="begin"
      aria-label="Begin journaling"
      className="px-6 py-36 sm:px-10 md:py-48"
    >
      <div className="mx-auto w-full max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, rotateX: 50, y: 40 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1.8, ease: EASE }}
          style={{ transformPerspective: 1100 }}
          className="rounded-[30px] border border-border bg-paper p-10 shadow-panel sm:p-16"
        >
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
            Blank page
          </p>
          <h2 className="mt-8 font-display text-4xl leading-[1.08] sm:text-6xl">
            Your next page
            <span className="block italic text-primary">starts here.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
            <Caret />
          </p>
          <div className="mt-10 flex justify-center">
            <Button variant="solid" size="pill" className="px-10">
              Begin journaling
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Free while you find out whether it helps.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
