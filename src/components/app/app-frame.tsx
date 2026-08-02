import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  LineChart,
  MessageCircle,
  Settings as SettingsIcon,
  Sparkle,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { EASE } from "@/components/story/primitives";
import { useProfile, useDashboard } from "@/hooks/useApi";

export const navItems = [
  { key: "journal", label: "Journal", icon: BookOpen },
  { key: "reflections", label: "Reflections", icon: Sparkle },
  { key: "timeline", label: "Timeline", icon: LineChart },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "talk", label: "Talk", icon: MessageCircle },
  { key: "profile", label: "You", icon: User },
  { key: "settings", label: "Settings", icon: SettingsIcon },
] as const;

export type NavKey = (typeof navItems)[number]["key"];

/**
 * AppFrame — the MindCare application window. Used everywhere a product
 * surface is shown so each screen reads as one coherent piece of software.
 */
export function AppFrame({
  active,
  title,
  subtitle,
  action,
  children,
  rail = true,
  className,
}: {
  active: NavKey;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  rail?: boolean;
  className?: string;
}) {
  const { data: profile } = useProfile();
  const { data: dashboard } = useDashboard();

  const displayName = profile?.display_name || "Member";
  const handle = profile?.email ? profile.email.split("@")[0] : "member";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "M";
  const streak = dashboard?.mood_count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.3, ease: EASE }}
      className={cn(
        "overflow-hidden rounded-[26px] border border-border bg-surface shadow-panel",
        className,
      )}
    >
      {/* window bar */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-surface-warm px-5 py-3">
        <span aria-hidden className="size-2 rounded-full bg-border" />
        <span aria-hidden className="size-2 rounded-full bg-border" />
        <span aria-hidden className="size-2 rounded-full bg-border" />
        <span className="ml-3 truncate text-[0.68rem] tracking-[0.14em] text-muted-foreground uppercase">
          MindCare · {handle}
        </span>
      </div>

      <div className="flex min-h-[420px]">
        {rail ? (
          <nav
            aria-label="Application"
            className="hidden w-[168px] shrink-0 flex-col justify-between border-r border-border/70 bg-surface-warm px-3 py-5 sm:flex"
          >
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const on = item.key === active;
                return (
                  <li key={item.key}>
                    <span
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2 text-[0.82rem] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        on
                          ? "bg-primary-soft text-primary"
                          : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon aria-hidden className="size-[15px]" strokeWidth={1.6} />
                      {item.label}
                    </span>

                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-center gap-2.5 rounded-xl px-2 py-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-[0.6rem] tracking-wide text-primary-foreground">
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.76rem]">{displayName}</span>
                <span className="block text-[0.66rem] text-muted-foreground">
                  {streak} day streak
                </span>
              </span>
            </div>
          </nav>
        ) : null}

        <div className="min-w-0 flex-1">
          {/* On small screens the rail collapses into a single quiet chip. */}
          {rail ? (
            <p className="flex items-center gap-2 border-b border-border/60 px-5 py-2.5 text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              {navItems.find((i) => i.key === active)?.label}
            </p>
          ) : null}
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border/60 px-5 py-4 sm:flex sm:flex-wrap sm:justify-between sm:px-7">
            <div className="min-w-0">
              <h3 className="font-display text-[1.05rem] leading-tight sm:text-xl">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 text-[0.76rem] leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {action}
          </header>
          <div className="px-5 py-6 sm:px-7 sm:py-7">{children}</div>
        </div>

      </div>
    </motion.div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "accent";
}) {
  return (
    <span
      className={cn(
        "soft-press inline-flex cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide",
        tone === "muted" && "bg-muted text-muted-foreground hover:bg-border/70",
        tone === "primary" && "bg-primary-soft text-primary",
        tone === "accent" && "bg-accent-soft text-accent",
      )}
    >
      {children}
    </span>
  );

}
