import { motion } from "motion/react";
import { Check, Cloud, Lock, Undo2 } from "lucide-react";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { Caret, EASE, useInViewOnce, useTypewriter } from "@/components/story/primitives";
import { entry, moodMeta, type MoodKey } from "@/components/app/data";

const bands: MoodKey[] = ["low", "flat", "steady", "warm", "bright"];

/** The real editor: title, live word count, mood picker, tags, autosave. */
export function JournalEditor({ typing = true }: { typing?: boolean }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>("-15% 0px");
  const opener = entry.paragraphs[0] ?? "";
  const typed = useTypewriter(opener, 22, typing && inView);
  const first = typing ? typed : opener;

  return (
    <div ref={ref}>
      <AppFrame
        active="journal"
        title={entry.title}
        subtitle={entry.date}
        action={
          <span className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
            <Cloud aria-hidden className="size-3.5" strokeWidth={1.6} />
            Saved locally · encrypted
          </span>
        }
      >
        <div className="grid gap-7 lg:grid-cols-[1fr_190px]">
          <div>
            <div className="rounded-2xl bg-paper p-5 sm:p-7">
              <p className="font-display text-[1.02rem] leading-[1.95rem] text-foreground/90 sm:text-[1.12rem] sm:leading-[2.15rem]">
                {first}
                {typing && first.length < opener.length ? <Caret /> : null}
              </p>
              {entry.paragraphs.slice(1).map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
                  whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 1.4 + i * 0.5, ease: EASE }}
                  className="mt-5 font-display text-[1.02rem] leading-[1.95rem] text-foreground/85 sm:text-[1.12rem] sm:leading-[2.15rem]"
                >
                  {p}
                </motion.p>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] text-muted-foreground">
              <span>{entry.words} words</span>
              <span>{entry.minutes} min</span>
              <span>{entry.location}</span>
              <span className="flex items-center gap-1.5">
                <Undo2 aria-hidden className="size-3.5" strokeWidth={1.6} /> Version history
              </span>
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                How did it feel?
              </p>
              <div className="mt-3 flex gap-1.5">
                {bands.map((b, i) => (
                  <motion.button
                    key={b}
                    type="button"
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: EASE }}
                    aria-label={moodMeta[b].label}
                    aria-pressed={b === "steady"}
                    className="group grid size-8 place-items-center rounded-full border transition-transform duration-500 hover:scale-110"
                    style={{
                      background: moodMeta[b].token,
                      borderColor:
                        b === "steady" ? "var(--color-foreground)" : "transparent",
                      opacity: b === "steady" ? 1 : 0.55,
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[0.72rem] text-muted-foreground">
                Steady — a shade better than yesterday.
              </p>
            </div>

            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                Tags
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <Pill key={t} tone="primary">
                    {t}
                  </Pill>
                ))}
                <Pill>+ add</Pill>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-surface-warm p-4">
              <p className="flex items-center gap-1.5 text-[0.72rem] text-primary">
                <Lock aria-hidden className="size-3.5" strokeWidth={1.7} /> Private entry
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                Only you can open this. Reflections are generated on-device and
                never stored on our servers.
              </p>
            </div>

            <p className="flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
              <Check aria-hidden className="size-3.5" strokeWidth={1.7} /> Autosaved 9:47 pm
            </p>
          </aside>
        </div>
      </AppFrame>
    </div>
  );
}
