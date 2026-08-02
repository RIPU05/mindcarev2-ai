import { useState } from "react";
import { motion } from "motion/react";
import { Download, Feather, Flame, Moon, LogOut } from "lucide-react";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, useDashboard, useJournals } from "@/hooks/useApi";
import { moodMeta } from "@/components/app/data";

export function ProfileScreen() {
  const { user: authUser, login, register, logout } = useAuth();
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const { data: dashboard } = useDashboard();
  const { data: journals } = useJournals();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);

  // Auto-fill timezone state when profile loads
  useState(() => {
    if (profile?.timezone) {
      setTimezone(profile.timezone);
    }
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp) {
      await register(email, password, name || "Anonymous User");
    } else {
      await login(email, password);
    }
  };

  const handleTimezoneSave = () => {
    updateProfile({ timezone });
    setIsEditingTimezone(false);
  };

  const handleExport = () => {
    if (!journals?.items) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(journals.items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mindcare_export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 1. Render Login/Register forms if user is not authenticated
  if (!authUser) {
    return (
      <AppFrame
        active="profile"
        title="MindCare Account"
        subtitle="Sign in or sign up to save your journal entries and analyze your moods."
      >
        <div className="mx-auto max-w-sm rounded-2xl bg-paper p-6 shadow-soft border border-border">
          <h4 className="font-display text-xl text-center">
            {isSignUp ? "Create your private account" : "Welcome back to MindCare"}
          </h4>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            All data is encrypted and secure.
          </p>

          <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full cursor-default rounded-xl bg-primary py-2 text-[0.85rem] font-medium text-primary-foreground transition-all hover:bg-primary/95"
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-primary underline"
            >
              {isSignUp ? "Already have an account? Log in" : "New to MindCare? Sign up"}
            </button>
          </div>
        </div>
      </AppFrame>
    );
  }

  // 2. Render authenticated profile view
  const userInitials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : authUser.email.slice(0, 2).toUpperCase();

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";

  const stats = [
    { icon: Feather, k: "Entries", v: String(dashboard?.journal_count ?? 0) },
    { icon: Flame, k: "Current run", v: `${dashboard?.mood_count ?? 0} days` }, // mock or dashboard streak value
    { icon: Moon, k: "Risk level", v: String(dashboard?.risk_level ?? "unknown") },
  ];

  return (
    <AppFrame
      active="profile"
      title={profile?.display_name || authUser.email}
      subtitle={`Writing since ${joinedDate} · ${profile?.timezone || "UTC"}`}
      action={
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="flex cursor-default items-center gap-1.5 text-[0.7rem] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download aria-hidden className="size-3.5" strokeWidth={1.6} /> Export all
            entries
          </button>
          <button
            onClick={logout}
            className="flex cursor-default items-center gap-1.5 text-[0.7rem] text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut aria-hidden className="size-3.5" strokeWidth={1.6} /> Log out
          </button>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="flex items-center gap-4 rounded-2xl bg-paper p-5 border border-border/70">
            <span className="grid size-14 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
              {userInitials}
            </span>
            <span>
              <span className="block font-display text-lg">{profile?.display_name || "Account Member"}</span>
              <span className="mt-0.5 block text-[0.76rem] text-muted-foreground">
                {authUser.email}
              </span>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
                  className="rounded-2xl border border-border/70 bg-surface p-4 card-lift"
                >
                  <Icon
                    aria-hidden
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.6}
                  />
                  <p className="mt-3 font-display text-xl">{s.v}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.k}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-surface-warm p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Timezone Setting
            </p>
            {isEditingTimezone ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-1.5 text-[0.8rem]"
                />
                <button
                  onClick={handleTimezoneSave}
                  className="rounded-xl bg-primary px-3 py-1.5 text-[0.75rem] text-primary-foreground"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[0.8rem] text-foreground">{profile?.timezone || "UTC"}</span>
                <button
                  onClick={() => setIsEditingTimezone(true)}
                  className="text-xs text-primary underline"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-surface p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Personal Reflection Goal
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-baseline justify-between gap-4">
                <span className="font-display text-[1rem]">Active Mindfulness</span>
                <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                  since signup
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-paper p-5">
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              Your Journal Tags
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {journals?.items && journals.items.length > 0 ? (
                Array.from(new Set(journals.items.flatMap(j => j.tags))).slice(0, 10).map((t) => (
                  <Pill key={t} tone="primary">
                    {t}
                  </Pill>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tags used yet</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-primary-soft p-5">
            <p className="font-display text-[1rem] leading-relaxed text-primary">
              “Privacy is foundational. MindCare reflections are built to keep your thoughts local, safe, and secure.”
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
