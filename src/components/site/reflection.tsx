import { Quote } from "lucide-react";

import { Reveal, Section, SectionHeading } from "@/components/site/section";

const entry = `Third late night this week. I told myself it was the deadline but honestly I think I keep working because the flat is too quiet after 9. Called mum for eleven minutes and felt better immediately, then went straight back to the laptop.`;

const reflection = `You noticed something important tonight: the work isn't only about the deadline. When you wrote about calling your mum, the tone of your entry shifted — shorter sentences, less defending yourself. That's the second time this month a small connection has changed how an evening reads.

Nothing here needs fixing right now. It might just be worth seeing whether the quiet, rather than the workload, is the thing you're staying late to avoid.`;

export function Reflection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="AI reflection"
        title="It writes back like someone who read it properly."
        description="A real example of an entry and the reflection MindCare returned, shared with permission."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <article className="h-full rounded-3xl border border-border bg-card p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Journal entry</p>
              <p className="text-xs text-muted-foreground">Tue, 11:48pm</p>
            </div>
            <p className="mt-6 font-display text-lg leading-relaxed text-foreground/90">
              {entry}
            </p>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
              {["Tired", "Lonely", "Relieved", "Driven"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.12}>
          <article className="h-full rounded-3xl border border-border bg-primary-soft p-8">
            <div className="flex items-center gap-2">
              <Quote className="size-4 text-primary" aria-hidden />
              <p className="eyebrow">MindCare reflection</p>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85 sm:text-base">
              {reflection.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 20)}>{paragraph}</p>
              ))}
            </div>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
