import { Reveal, Section, SectionHeading } from "@/components/site/section";

const steps = [
  {
    title: "You journal",
    body: "Write as much or as little as you want. Voice, typing, or a single sentence before bed.",
  },
  {
    title: "Emotion analysis",
    body: "The entry is read for feeling and intensity, then tagged with the emotions actually present in your words.",
  },
  {
    title: "Safety screening",
    body: "If something in an entry suggests real distress, MindCare surfaces human crisis resources before anything else.",
  },
  {
    title: "Reflection generation",
    body: "A short, warm response written back to you — observation rather than instruction.",
  },
  {
    title: "Your dashboard",
    body: "Everything settles into your timeline, where weeks of small notes become a pattern you can see.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="Five quiet steps, every time you write."
        description="The whole loop takes about three minutes and happens inside your own account."
      />

      <ol className="relative mt-16 max-w-2xl">
        <span
          aria-hidden
          className="absolute left-[15px] top-3 bottom-6 w-px bg-border"
        />
        {steps.map((step, i) => (
          <li key={step.title} className="relative pl-14 pb-12 last:pb-0">
            <Reveal delay={i * 0.08}>
              <span
                aria-hidden
                className="absolute left-0 top-1 grid size-8 place-items-center rounded-full border border-border bg-background font-sans text-xs font-semibold text-primary"
              >
                {i + 1}
              </span>
              <h3 className="font-display text-2xl">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
