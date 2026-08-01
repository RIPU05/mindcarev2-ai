"use client";

import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineError, SectionSkeleton } from "@/components/app/api-states";
import { useProfile, useUpdateProfile } from "@/lib/api/hooks";

export default function ProfilePage() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();

  return (
    <PageMotion>
      <PageHeader title="Profile" eyebrow="Personal details and preferences" action={<Button disabled={updateProfile.isPending}>Save changes</Button>} />
      {profile.isLoading ? <SectionSkeleton /> : profile.isError ? <InlineError error={profile.error} onRetry={() => profile.refetch()} /> : null}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-800">{(profile.data?.display_name ?? "MindCare User").slice(0, 2).toUpperCase()}</div>
          <h3 className="mt-4 font-semibold">{profile.data?.display_name ?? "MindCare User"}</h3>
          <p className="text-sm text-stone-500">{profile.data?.email ?? "user@example.com"}</p>
        </Card>
        <Card className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Display name<Input className="mt-2" value={profile.data?.display_name ?? ""} readOnly /></label>
          <label className="text-sm font-medium">Timezone<Input className="mt-2" value={profile.data?.timezone ?? ""} readOnly /></label>
          <label className="text-sm font-medium">Language<Input className="mt-2" defaultValue="English" /></label>
          <label className="text-sm font-medium">Reflection tone<Input className="mt-2" defaultValue="Gentle and concise" /></label>
        </Card>
      </div>
    </PageMotion>
  );
}
