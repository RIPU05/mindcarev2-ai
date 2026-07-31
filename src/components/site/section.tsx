import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
  tone = "base",
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  tone?: "base" | "surface";
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 py-24 sm:px-8 md:py-32",
        tone === "surface" && "bg-surface-warm",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow mb-5">{eyebrow}</p> : null}
      <h2 className="text-balance-tight text-3xl leading-[1.12] sm:text-4xl md:text-[2.9rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
