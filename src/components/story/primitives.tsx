import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const EASE = [0.16, 1, 0.3, 1] as const;

type Tone = "base" | "paper" | "deep";

const toneBg: Record<Tone, string> = {
  base: "var(--color-background)",
  paper: "var(--color-paper)",
  deep: "var(--color-primary-deep)",
};

/**
 * Seam — dissolves the hard edge between two chapters so the page reads as
 * one continuous surface rather than stacked sections.
 */
export function Seam({
  from,
  to,
  height = 140,
}: {
  from: Tone;
  to: Tone;
  height?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none -my-px w-full"
      style={{
        height,
        background: `linear-gradient(to bottom, ${toneBg[from]}, ${toneBg[to]})`,
      }}
    />
  );
}

/** Gentle scroll parallax for any block of content. */
export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export function Chapter({
  id,
  index,
  label,
  children,
  className,
  tone = "base",
}: {
  id: string;
  index?: string;
  label?: string;
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn(
        "relative px-6 py-40 sm:px-10 md:py-56",
        tone === "paper" && "bg-paper",
        tone === "deep" && "bg-primary-deep text-primary-foreground",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-5xl">
        {index || label ? (
          <FadeIn className="mb-20 flex items-center gap-4">
            {index ? (
              <span className="font-display text-sm italic opacity-60">{index}</span>
            ) : null}
            <motion.span
              aria-hidden
              className="h-px w-10 origin-left bg-current opacity-25"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE }}
            />
            {label ? (
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] opacity-60">
                {label}
              </span>
            ) : null}
          </FadeIn>
        ) : null}
        {children}
      </div>
    </section>
  );
}


export function FadeIn({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 1.2, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word text reveal — slow and editorial. */
export function RevealWords({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "p" | "h1" | "h2" | "h3";
}) {
  const words = text.split(" ");
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "105%", opacity: 0 },
              shown: { y: "0%", opacity: 1 },
            }}
            transition={{ duration: 1, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/** Types out text once it scrolls into view. */
export function useTypewriter(text: string, speed = 34, start = true) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!start) return;
    let i = 0;
    setOut("");
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, start]);

  return out;
}

export function useInViewOnce<T extends HTMLElement>(margin = "-20% 0px") {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: margin as never });
  return { ref, inView };
}

export function Caret({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.16em] bg-primary",
        className,
      )}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
    />
  );
}
