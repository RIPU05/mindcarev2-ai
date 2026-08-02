import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { AppFrame } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { useSettings, useUpdateSettings } from "@/hooks/useApi";

export function SettingsScreen() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();

  const handleToggle = (key: "e2e_encryption_enabled" | "privacy_lock_enabled" | "weekly_summary_enabled" | "notifications_enabled", currentValue: boolean) => {
    updateSettings({ [key]: !currentValue });
    toast.success("Settings updated");
  };

  const groups = [
    {
      group: "Privacy",
      items: [
        {
          key: "e2e_encryption_enabled" as const,
          label: "End-to-end encryption",
          detail: "Keys are generated on your device and are never visible to the backend service.",
          value: settings?.e2e_encryption_enabled ?? false,
        },
        {
          key: "privacy_lock_enabled" as const,
          label: "Lock with Face ID",
          detail: "Require bio-metric authentication when reopening the browser frame.",
          value: settings?.privacy_lock_enabled ?? false,
        },
      ],
    },
    {
      group: "Reflections",
      items: [
        {
          key: "weekly_summary_enabled" as const,
          label: "Weekly email report",
          detail: "Send a monthly/weekly summary letter to help trace long running themes.",
          value: settings?.weekly_summary_enabled ?? false,
        },
        {
          key: "notifications_enabled" as const,
          label: "Daily reminder notification",
          detail: "A quiet visual nudge to check-in at your usual writing hour.",
          value: settings?.notifications_enabled ?? false,
        },
      ],
    },
  ];

  return (
    <AppFrame
      active="settings"
      title="Settings"
      subtitle="Configure your privacy and journaling preferences."
      action={
        <span className="flex items-center gap-1.5 text-[0.7rem] text-primary">
          <Lock aria-hidden className="size-3.5" strokeWidth={1.7} /> Device key held
          by you
        </span>
      }
    >
      <div className="grid gap-8 md:grid-cols-2">
        {groups.map((g, gi) => (
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
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.value}
                    aria-label={item.label}
                    onClick={() => handleToggle(item.key, item.value)}
                    className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-500 cursor-default"
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
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-border/70 bg-paper p-5">
        <p className="font-display text-[1rem] leading-relaxed text-red-500">
          Delete everything, permanently.
        </p>
        <p className="mt-2 max-w-lg text-[0.76rem] leading-relaxed text-muted-foreground">
          Clear your remote account settings and sync preferences. This action runs immediately and resets defaults.
        </p>
      </div>
    </AppFrame>
  );
}
