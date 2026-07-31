import { motion } from "motion/react";

import { Chapter, EASE, FadeIn } from "@/components/story/primitives";

export function Privacy() {
  return (
    <Chapter id="privacy" index="VII" label="Privacy" tone="deep">
      <div className="flex flex-col items-center text-center">
        <motion.svg
          viewBox="0 0 48 60"
          className="h-20 w-16"
          role="img"
          aria-label="A closing lock"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true }}
        >
          <motion.path
            d="M14 26 V18 a10 10 0 0 1 20 0 v8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
            transition={{ duration: 1.8, ease: EASE }}
          />
          <motion.rect
            x="8"
            y="26"
            width="32"
            height="26"
            rx="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            variants={{ hidden: { pathLength: 0, opacity: 0 }, shown: { pathLength: 1, opacity: 1 } }}
            transition={{ duration: 1.6, delay: 0.7, ease: EASE }}
          />
          <motion.circle
            cx="24"
            cy="39"
            r="2.6"
            fill="currentColor"
            variants={{ hidden: { scale: 0 }, shown: { scale: 1 } }}
            transition={{ duration: 0.8, delay: 2, ease: EASE }}
            style={{ transformOrigin: "24px 39px" }}
          />
        </motion.svg>

        <FadeIn delay={0.4}>
          <h2 className="mt-12 font-display text-4xl leading-[1.1] sm:text-6xl">
            Your thoughts belong to you.
          </h2>
          <p className="mx-auto mt-8 max-w-md text-base leading-relaxed opacity-70">
            End-to-end encrypted. Never sold, never advertised against, never
            used to train anyone's model. Export or delete everything in one tap.
          </p>
        </FadeIn>
      </div>
    </Chapter>
  );
}
