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
import { user } from "@/components/app/data";

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
          MindCare · {user.handle}
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
                        "flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2 text-[0.82rem] transition-colors duration-500",
                        on
                          ? "bg-primary-soft text-primary"
                          : "text-muted-foreground hover:bg-muted",
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
                {user.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.76rem]">{user.name}</span>
                <span className="block text-[0.66rem] text-muted-foreground">
                  {user.streak} day streak
                </span>
              </span>
            </div>
          </nav>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-7">
            <div>
              <h3 className="font-display text-lg leading-tight sm:text-xl">{title}</h3>
              {subtitle ? (
                <p className="mt-1 text-[0.78rem] text-muted-foreground">{subtitle}</p>
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "primary" && "bg-primary-soft text-primary",
        tone === "accent" && "bg-accent-soft text-accent",
      )}
    >
      {children}
    </span>
  );
}
