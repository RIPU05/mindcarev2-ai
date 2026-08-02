import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

const chapters = [
  { id: "writing", label: "The entry" },
  { id: "reading", label: "Being read" },
  { id: "emotions", label: "Emotion map" },
  { id: "reflection", label: "The reflection" },
  { id: "growth", label: "Over time" },
  { id: "assistant", label: "The conversation" },
  { id: "privacy", label: "Privacy" },
  { id: "questions", label: "Questions" },
  { id: "begin", label: "Begin" },
] as const;

/** Scroll spy — highlights the chapter currently occupying the viewport. */
function useActiveChapter() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function StoryChrome() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 24,
    restDelta: 0.001,
  });
  const active = useActiveChapter();
  const activeLabel = chapters.find((c) => c.id === active)?.label ?? null;

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-primary/70"
      />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-700",
          active
            ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
            : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-10 sm:py-6">
          <span className="flex min-w-0 items-center gap-2.5">
            <motion.span
              aria-hidden
              className="block size-2 shrink-0 rounded-full bg-primary"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-display text-base tracking-tight">
              MindCare
            </span>
            {/* On small screens the rail is hidden — the header names the chapter instead. */}
            <AnimatePresence mode="wait">
              {activeLabel ? (
                <motion.span
                  key={activeLabel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="truncate border-l border-border pl-2.5 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground lg:hidden"
                >
                  {activeLabel}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
          <a
            href="#begin"
            className="shrink-0 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-all duration-500 hover:text-foreground hover:tracking-[0.26em]"
          >
            Begin
          </a>
        </div>
      </header>


      {/* Chapter rail — a quiet index of where you are in the story. */}
      <nav
        aria-label="Chapters"
        className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      >
        <ul className="space-y-3.5">
          {chapters.map((c) => {
            const on = c.id === active;
            return (
              <li key={c.id} className="group flex items-center justify-end gap-3">
                <span
                  className={cn(
                    "pointer-events-none translate-x-1 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground opacity-0 transition-all duration-500",
                    "group-hover:translate-x-0 group-hover:opacity-100",
                    on && "opacity-70",
                  )}
                >
                  {c.label}
                </span>
                <a
                  href={`#${c.id}`}
                  aria-label={c.label}
                  aria-current={on ? "true" : undefined}
                  className="grid size-4 place-items-center"
                >
                  <motion.span
                    className={cn(
                      "block rounded-full",
                      on ? "bg-primary" : "bg-foreground/25",
                    )}
                    animate={{
                      width: on ? 8 : 5,
                      height: on ? 8 : 5,
                      opacity: on ? 1 : 0.55,
                    }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function StoryFooter() {
  return (
    <footer className="border-t border-border px-6 py-14 sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base text-foreground">MindCare</p>
        <p className="max-w-sm leading-relaxed">
          A private place to think. Not a substitute for therapy or crisis care —
          if you're struggling, please reach out to someone near you.
        </p>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
