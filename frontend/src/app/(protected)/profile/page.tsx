"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, Shield as ShieldIcon, Bell, Globe as GlobeIcon, Save } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InlineError, SectionSkeleton } from "@/components/app/api-states";
import { useProfile, useUpdateProfile } from "@/lib/api/hooks";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name || "");
      setTimezone(profile.data.timezone || "UTC");
    }
  }, [profile.data]);

  function handleSave() {
    updateProfile.mutate(
      {
        display_name: displayName,
        timezone: timezone
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    );
  }

  const userDisplayName = displayName || user?.user_metadata?.display_name || "MindCare User";
  const initials = userDisplayName.slice(0, 2).toUpperCase();

  return (
    <PageMotion>
      <PageHeader
        title="Profile & Settings"
        eyebrow="Manage your personal details, preferences, and privacy controls"
        action={
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            <Save className="size-4" /> {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {profile.isLoading ? <SectionSkeleton /> : null}
      {profile.isError ? (
        <div className="mb-6">
          <InlineError error={profile.error} onRetry={() => profile.refetch()} />
        </div>
      ) : null}

      {saveSuccess && (
        <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Profile changes saved successfully!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* User Avatar Card */}
        <Card className="glass-card flex flex-col items-center text-center p-8">
          <div className="relative">
            <div className="grid size-28 place-items-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-3xl font-extrabold text-white shadow-xl shadow-emerald-500/25">
              {initials}
            </div>
            <div className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-xl bg-white text-emerald-600 shadow-md border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <UserIcon className="size-4" />
            </div>
          </div>

          <h3 className="mt-5 font-extrabold text-xl text-slate-900 dark:text-slate-100">
            {userDisplayName}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{user?.email || profile.data?.email}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge variant="emerald">Supabase Auth</Badge>
            <Badge variant="teal">Encrypted Storage</Badge>
          </div>
        </Card>

        {/* Profile Details Form */}
        <div className="space-y-6">
          <Card className="glass-card space-y-5 p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <GlobeIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Personal Information</h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 h-11 rounded-xl text-sm"
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Timezone
                </label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-2 h-11 rounded-xl text-sm"
                  placeholder="e.g. UTC, America/New_York"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Account Email (Read-only)
                </label>
                <Input
                  value={user?.email || profile.data?.email || ""}
                  readOnly
                  className="mt-2 h-11 rounded-xl text-sm bg-slate-50 dark:bg-slate-850"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Member Since
                </label>
                <Input
                  value={profile.data?.created_at ? new Date(profile.data.created_at).toLocaleDateString() : "Active User"}
                  readOnly
                  className="mt-2 h-11 rounded-xl text-sm bg-slate-50 dark:bg-slate-850"
                />
              </div>
            </div>
          </Card>

          {/* Privacy & Preferences */}
          <Card className="glass-card space-y-5 p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <ShieldIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Privacy & Companion Settings</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Safety Alerts</span>
                  <Badge variant="emerald">Enabled</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">Automatically flag high stress patterns in journal entries.</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Encryption</span>
                  <Badge variant="teal">AES-256</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">All journal entries are strictly user-isolated with RLS policies.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageMotion>
  );
}
