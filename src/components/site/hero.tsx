import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/site/dashboard-card";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:px-8 md:pb-32 md:pt-24">
      <div
        aria-hidden
        className="grain-surface pointer-events-none absolute inset-0 opacity-40"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.02fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-secondary" aria-hidden />
            Private journaling, gently understood
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="text-balance-tight mt-7 text-[2.6rem] leading-[1.06] sm:text-[3.4rem] md:text-[4rem]"
          >
            Understand your mind,
            <br className="hidden sm:block" />{" "}
            <span className="italic text-primary">one reflection</span> at a
            time.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            MindCare AI is a quiet space to write freely. It notices the
            emotions in your words, surfaces the patterns behind your weeks, and
            writes back with a reflection that sounds like it came from someone
            who was actually listening.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button variant="solid" size="pill" asChild>
              <a href="#cta">
                Start journaling
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button variant="quiet" size="pill" asChild>
              <a href="#how-it-works">Learn more</a>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-8"
          >
            {[
              { value: "End-to-end", label: "Encrypted entries" },
              { value: "3 min", label: "Average entry" },
              { value: "No ads", label: "Never sold, ever" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-xl">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="relative"
        >
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-4xl bg-surface-warm"
          />
          <DashboardCard variant="compact" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
            className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <p className="eyebrow">Today's reflection</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              “You've been carrying a lot quietly this week. It might be worth
              naming one thing you'd like help with.”
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
