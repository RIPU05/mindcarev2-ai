import { motion } from "motion/react";
import { Lock } from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { settingsGroups } from "@/components/app/data";

export function SettingsScreen() {
  return (
    <AppFrame
      active="settings"
      title="Settings"
      subtitle="Everything is off until you turn it on"
      action={
        <span className="flex items-center gap-1.5 text-[0.7rem] text-primary">
          <Lock aria-hidden className="size-3.5" strokeWidth={1.7} /> Device key held
          by you
        </span>
      }
    >
      <div className="grid gap-8 md:grid-cols-2">
        {settingsGroups.map((g, gi) => (
          <div key={g.group}>
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              {g.group}
            </p>
            <ul className="mt-4 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-surface">
              {g.items.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: gi * 0.1 + i * 0.08, ease: EASE }}
                  className="flex items-start justify-between gap-5 px-5 py-4"
                >
                  <span>
                    <span className="block text-[0.88rem]">{item.label}</span>
                    <span className="mt-1 block text-[0.73rem] leading-relaxed text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                  <span
                    role="switch"
                    aria-checked={item.value}
                    aria-label={item.label}
                    className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-500"
                    style={{
                      background: item.value
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    }}
                  >
                    <motion.span
                      className="block size-4 rounded-full bg-surface shadow-soft"
                      animate={{ x: item.value ? 16 : 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-border/70 bg-paper p-5">
        <p className="font-display text-[1rem] leading-relaxed">
          Delete everything, permanently.
        </p>
        <p className="mt-2 max-w-lg text-[0.76rem] leading-relaxed text-muted-foreground">
          One confirmation, no retention window, no backup copy. 148 entries would
          be gone in under a second — which is how it should work.
        </p>
      </div>
    </AppFrame>
  );
}
