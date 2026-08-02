import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

import { Chapter, EASE, FadeIn } from "@/components/story/primitives";
import { cn } from "@/lib/utils";

const questions = [
  {
    q: "Does anyone read my entries?",
    a: "No one. Entries are encrypted with a key held on your device. Reflections are generated for you and stored the same way — we cannot open them, and there is no admin view that can.",
  },
  {
    q: "Is this therapy?",
    a: "No. MindCare is a place to think in your own words, and to notice patterns you might otherwise miss. It doesn't diagnose, and it will never pretend to replace a person who can help.",
  },
  {
    q: "What happens if I skip a few days?",
    a: "Nothing. There are no streak warnings, no notifications guilting you back. The calendar simply shows the days you wrote, and the days you didn't — both are information.",
  },
  {
    q: "Can I take my writing with me?",
    a: "Always. Export everything as plain Markdown or PDF in one action, and delete the account in one more. There's no retention window and no backup copy kept behind the scenes.",
  },
];

/** Questions — an accordion that opens with a slow, measured height change. */
export function Questions() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Chapter id="questions" index="VIII" label="Questions">
      <div className="grid gap-14 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
        <FadeIn className="md:sticky md:top-32 md:self-start">
          <h2 className="font-display text-3xl leading-[1.14] sm:text-[2.6rem]">
            Fair things
            <span className="block italic text-primary">to ask first.</span>
          </h2>
        </FadeIn>

        <ul className="divide-y divide-border/70 border-y border-border/70">
          {questions.map((item, i) => {
            const on = open === i;
            return (
              <motion.li
                key={item.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 1, delay: i * 0.12, ease: EASE }}
              >
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? null : i)}
                  className="group flex w-full items-start justify-between gap-6 py-6 text-left"
                >
                  <span
                    className={cn(
                      "font-display text-lg leading-snug transition-colors duration-500 sm:text-xl",
                      on ? "text-primary" : "group-hover:text-primary",
                    )}
                  >
                    {item.q}
                  </span>
                  <motion.span
                    aria-hidden
                    className="mt-1 shrink-0 text-muted-foreground"
                    animate={{ rotate: on ? 135 : 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                  >
                    <Plus className="size-4" strokeWidth={1.6} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {on ? (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.75, ease: EASE },
                        opacity: { duration: 0.5, ease: EASE },
                      }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-7 text-[0.95rem] leading-[1.85rem] text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </Chapter>
  );
}
