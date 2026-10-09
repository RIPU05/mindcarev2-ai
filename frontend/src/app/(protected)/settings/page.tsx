"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Key,
  Download,
  Trash2,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  ExternalLink
} from "lucide-react";

import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineError, SectionSkeleton } from "@/components/app/api-states";
import { useProfile, useJournalEntries } from "@/lib/api/hooks";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, type ThemeMode, type DensityMode } from "@/providers/settings-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const profile = useProfile();
  const journals = useJournalEntries();
  const {
    preferences,
    setTheme,
    setDensity,
    setReducedMotion,
    setNotificationPref,
    setPrivacyPref,
    isDark
  } = useSettings();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  function toggleSection(title: string) {
    setActiveSection((prev) => (prev === title ? null : title));
  }

  // Handle Real Data Export
  function handleDataExport() {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const items = journals.data?.items ?? [];
      const userEmail = user?.email || profile.data?.email || "user";
      const timestamp = new Date().toISOString().slice(0, 10);

      if (exportFormat === "json") {
        const payload = {
          export_date: new Date().toISOString(),
          user: {
            email: userEmail,
            display_name: profile.data?.display_name || user?.user_metadata?.display_name || "",
            timezone: profile.data?.timezone || "UTC"
          },
          total_entries: items.length,
          journal_entries: items.map((entry) => ({
            id: entry.id,
            title: entry.title,
            content: entry.content,
            tags: entry.tags,
            source: entry.source,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          }))
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mindcare_journal_export_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // CSV Export
        const headers = ["id", "title", "content", "tags", "source", "created_at"];
        const rows = items.map((entry) => [
          `"${entry.id}"`,
          `"${(entry.title || "").replace(/"/g, '""')}"`,
          `"${(entry.content || "").replace(/"/g, '""')}"`,
          `"${(entry.tags || []).join(";")}"`,
          `"${entry.source || "manual"}"`,
          `"${entry.created_at}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mindcare_journal_export_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportSuccess(`Export generated successfully! Downloaded ${items.length} journal entries as ${exportFormat.toUpperCase()}.`);
    } catch (err: any) {
      setExportError(err?.message || "Failed to generate data export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <PageMotion>
      <PageHeader
        title="Settings & Configuration"
        eyebrow="Personalize application preferences, privacy controls, and data management"
      />

      {profile.isLoading ? <SectionSkeleton /> : null}
      {profile.isError ? (
        <div className="mb-6">
          <InlineError error={profile.error} onRetry={() => profile.refetch()} />
        </div>
      ) : null}

      <div className="space-y-4">
        {/* 1. Appearance Section */}
        <Card className="glass-card p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Sun className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Appearance</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Theme mode, layout density, and reduced motion preferences
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => toggleSection("Appearance")}
              className="gap-2 shrink-0"
              aria-expanded={activeSection === "Appearance"}
            >
              <span>Manage</span>
              {activeSection === "Appearance" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>

          {activeSection === "Appearance" && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
              {/* Theme Mode */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Theme Mode
                </label>
                <div className="mt-2.5 grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { mode: "system", label: "System", icon: Monitor },
                    { mode: "light", label: "Light", icon: Sun },
                    { mode: "dark", label: "Dark", icon: Moon }
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode as ThemeMode)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${
                        preferences.theme === mode
                          ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Density */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Layout Density
                </label>
                <div className="mt-2.5 flex items-center gap-3 max-w-md">
                  {[
                    { density: "comfortable", label: "Comfortable" },
                    { density: "compact", label: "Compact" }
                  ].map(({ density, label }) => (
                    <button
                      key={density}
                      onClick={() => setDensity(density as DensityMode)}
                      className={`flex-1 rounded-xl border p-3 text-xs font-semibold transition ${
                        preferences.density === density
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between max-w-md rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Reduced Motion</h4>
                  <p className="text-xs text-slate-500">Minimize animations and smooth scrolling effects</p>
                </div>
                <button
                  onClick={() => setReducedMotion(!preferences.reducedMotion)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    preferences.reducedMotion ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  role="switch"
                  aria-checked={preferences.reducedMotion}
                  aria-label="Toggle reduced motion"
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.reducedMotion ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* 2. Notifications Section */}
        <Card className="glass-card p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 grid size-9 place-items-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <Bell className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Notifications</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Mood reminders, reflection summaries, and weekly recaps
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => toggleSection("Notifications")}
              className="gap-2 shrink-0"
              aria-expanded={activeSection === "Notifications"}
            >
              <span>Manage</span>
              {activeSection === "Notifications" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>

          {activeSection === "Notifications" && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 max-w-lg">
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  These controls customize your client notification preferences. Delivery of scheduled email or mobile push alerts requires an active external notification service.
                </span>
              </div>

              {[
                { key: "moodReminders", label: "Daily Mood Reminders", detail: "Receive gentle prompts to record your daily check-in" },
                { key: "reflectionSummaries", label: "Reflection Summaries", detail: "Get periodic insights on recent journal writing" },
                { key: "weeklyRecaps", label: "Weekly Recaps", detail: "Receive weekly emotional rhythm reports" }
              ].map(({ key, label, detail }) => {
                const checked = preferences[key as keyof typeof preferences] as boolean;
                return (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</h4>
                      <p className="text-xs text-slate-500">{detail}</p>
                    </div>
                    <button
                      onClick={() => setNotificationPref(key as any, !checked)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                      role="switch"
                      aria-checked={checked}
                      aria-label={`Toggle ${label}`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          checked ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 3. Privacy Section */}
        <Card className="glass-card p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <Shield className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Privacy</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Journal visibility and local device storage controls
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => toggleSection("Privacy")}
              className="gap-2 shrink-0"
              aria-expanded={activeSection === "Privacy"}
            >
              <span>Manage</span>
              {activeSection === "Privacy" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>

          {activeSection === "Privacy" && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5 max-w-lg">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Journal Entry Synchronization
                </label>
                <div className="mt-2.5 space-y-2">
                  {[
                    { mode: "synced_account", title: "Synced to Account (Encrypted)", detail: "Journal entries are stored in Supabase with user Row Level Security policies" },
                    { mode: "private_device", title: "Local Device Cache Preference", detail: "Prioritize local storage caching for immediate offline reflections" }
                  ].map(({ mode, title, detail }) => (
                    <button
                      key={mode}
                      onClick={() => setPrivacyPref("journalVisibility", mode as any)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        preferences.journalVisibility === mode
                          ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <div className="font-bold text-sm">{title}</div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-slate-100">Security Guarantee: </span>
                Local preferences alter browser behavior only. All server-side entries are strictly isolated using PostgreSQL RLS policies keyed to your Supabase authentication ID.
              </div>
            </div>
          )}
        </Card>

        {/* 4. Security Section */}
        <Card className="glass-card p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 grid size-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <Key className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Security</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Active authentication session, recovery options, and session status
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => toggleSection("Security")}
              className="gap-2 shrink-0"
              aria-expanded={activeSection === "Security"}
            >
              <span>Manage</span>
              {activeSection === "Security" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>

          {activeSection === "Security" && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5 max-w-lg">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Authentication</span>
                  <Badge variant="emerald">Supabase Auth</Badge>
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.email || "Authenticated Session"}
                </div>
                <p className="text-xs text-slate-500">
                  Connected via JWT bearer token. Session auto-refreshes securely.
                </p>
                <div className="pt-2">
                  <Link href="/forgot-password">
                    <Button variant="outline" className="gap-2 text-xs">
                      <Lock className="size-3.5" /> Password Reset & Recovery <ExternalLink className="size-3" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Unsupported capabilities accurately marked */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 dark:bg-slate-900 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Remote Session Revocation & Passkeys</span>
                  <Badge variant="default" className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Not available yet
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Passkey registration (WebAuthn) and multi-device session revocation are not currently supported by the active backend authentication provider. No security credentials have been modified.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* 5. Data Export Section */}
        <Card className="glass-card p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Download className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Data Export</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Download journal reflections, mood history, and profile metadata
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => toggleSection("Data export")}
              className="gap-2 shrink-0"
              aria-expanded={activeSection === "Data export"}
            >
              <span>Manage</span>
              {activeSection === "Data export" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>

          {activeSection === "Data export" && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5 max-w-lg">
              {exportSuccess && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{exportSuccess}</span>
                </div>
              )}

              {exportError && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Export File Format
                </label>
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat("json")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold transition ${
                      exportFormat === "json"
                        ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    <FileJson className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-left">
                      <div>JSON Format</div>
                      <div className="text-[10px] font-normal text-slate-500">Structured data with full metadata</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold transition ${
                      exportFormat === "csv"
                        ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    <FileSpreadsheet className="size-5 text-teal-600 dark:text-teal-400" />
                    <div className="text-left">
                      <div>CSV Format</div>
                      <div className="text-[10px] font-normal text-slate-500">Tabular format for Excel / sheets</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Included Content:</p>
                <p>• All saved journal reflections and titles</p>
                <p>• Category tags, creation dates, and timestamps</p>
                <p>• User profile display name & timezone</p>
                <p className="text-slate-400 text-[11px] pt-1">No authentication tokens, credentials, or internal secrets are exported.</p>
              </div>

              <Button
                onClick={handleDataExport}
                disabled={isExporting}
                className="w-full h-11 gap-2"
              >
                <Download className="size-4" />
                <span>{isExporting ? "Generating Export..." : `Download ${exportFormat.toUpperCase()} Export`}</span>
              </Button>
            </div>
          )}
        </Card>

        {/* 6. Delete Account Section */}
        <Card className="glass-card p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 grid size-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Delete Account</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Permanent account removal placeholder & safe deletion notice
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => toggleSection("Delete account")}
              className="gap-2 shrink-0"
              aria-expanded={activeSection === "Delete account"}
            >
              <span>Delete</span>
              {activeSection === "Delete account" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>

          {activeSection === "Delete account" && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 max-w-lg">
              <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 text-xs text-amber-950 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Account deletion is not available yet</span>
                </div>
                <p className="leading-relaxed">
                  Self-serve account purging is currently disabled to prevent accidental data loss. To request account deletion or data removal, please contact support or your workspace administrator. No data has been modified.
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setActiveSection(null)} className="text-xs">
                  Close Notice
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageMotion>
  );
}
