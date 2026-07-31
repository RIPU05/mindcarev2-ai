import { Reveal, Section, SectionHeading } from "@/components/site/section";
import { DashboardCard } from "@/components/site/dashboard-card";

export function DashboardPreview() {
  return (
    <Section id="dashboard" tone="surface">
      <SectionHeading
        eyebrow="Your dashboard"
        title="A month of feeling, on one page."
        description="No leaderboards, no scores to beat. Just an honest picture of how the weeks have actually gone."
      />
      <Reveal delay={0.1} className="mt-14">
        <DashboardCard />
      </Reveal>
    </Section>
  );
}
