"use client";

import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineError, SectionSkeleton } from "@/components/app/api-states";
import { useProfile } from "@/lib/api/hooks";

const sections = [
  ["Appearance", "Theme, density, and reduced motion preferences"],
  ["Notifications", "Mood reminders, reflection summaries, and weekly recaps"],
  ["Privacy", "Journal visibility and local device controls"],
  ["Security", "Sessions, passkeys, and recovery options"],
  ["Data export", "Download journal, mood, and reflection history"],
  ["Delete account", "Permanent account removal placeholder"]
];

export default function SettingsPage() {
  const profile = useProfile();

  return (
    <PageMotion>
      <PageHeader title="Settings" eyebrow="Configuration architecture only" />
      {profile.isLoading ? <SectionSkeleton /> : profile.isError ? <InlineError error={profile.error} onRetry={() => profile.refetch()} /> : null}
      <div className="space-y-4">
        {sections.map(([title, detail]) => (
          <Card key={title} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-stone-500">{detail}</p></div>
            <Button variant={title === "Delete account" ? "danger" : "secondary"}>{title === "Delete account" ? "Delete" : "Manage"}</Button>
          </Card>
        ))}
      </div>
    </PageMotion>
  );
}
