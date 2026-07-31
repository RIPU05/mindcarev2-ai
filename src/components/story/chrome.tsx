import { motion, useScroll, useSpring } from "motion/react";

export function StoryChrome() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-primary/70"
      />
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="block size-2 rounded-full bg-primary"
            />
            <span className="font-display text-base tracking-tight">
              MindCare
            </span>
          </span>
          <a
            href="#begin"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Begin
          </a>
        </div>
      </header>
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
