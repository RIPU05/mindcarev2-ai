import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { conversation } from "@/components/app/data";

/** Assistant — conversation cards, an honest composer, no chat bubbles. */
export function AssistantScreen() {
  return (
    <AppFrame
      active="talk"
      title="Talking it through"
      subtitle="Thursday evening · this conversation stays with entry 148"
    >
      <div className="space-y-3">
        {conversation.map((c, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 1.1, delay: i * 0.14, ease: EASE }}
            className={
              c.from === "you"
                ? "rounded-2xl border border-border/70 bg-paper p-5 sm:p-6"
                : "rounded-2xl border border-border/70 bg-primary-soft p-5 sm:p-6"
            }
          >
            <div className="flex items-baseline justify-between">
              <p className="text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                {c.from === "you" ? "Nora" : "MindCare"}
              </p>
              <p className="text-[0.66rem] text-muted-foreground">{c.time}</p>
            </div>
            <p className="mt-3 font-display text-[1rem] leading-[1.85rem] text-foreground/90 sm:text-[1.08rem] sm:leading-[2rem]">
              {c.text}
            </p>
            {"cite" in c && c.cite ? (
              <p className="mt-4 border-l-2 border-primary/30 pl-3 text-[0.72rem] text-muted-foreground">
                {c.cite}
              </p>
            ) : null}
            {"prompts" in c && c.prompts ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {c.prompts.map((p) => (
                  <Pill key={p}>{p}</Pill>
                ))}
              </div>
            ) : null}
          </motion.article>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.7, ease: EASE }}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 pl-5"
        >
          <p className="flex-1 text-[0.88rem] text-muted-foreground">
            Say a little more…
          </p>
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <ArrowUp aria-hidden className="size-4" strokeWidth={1.8} />
          </span>
        </motion.div>
        <p className="pt-1 text-[0.7rem] text-muted-foreground">
          MindCare isn't a therapist. If things feel unsafe, it will always point
          you to a person.
        </p>
      </div>
    </AppFrame>
  );
}
