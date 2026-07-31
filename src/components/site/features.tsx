import {
  BookOpen,
  Sparkles,
  HeartHandshake,
  LineChart,
  CalendarCheck,
  MessagesSquare,
  LayoutDashboard,
  Waves,
} from "lucide-react";

import { Reveal, Section, SectionHeading } from "@/components/site/section";

const features = [
  {
    icon: BookOpen,
    title: "Secure journaling",
    body: "A calm writing surface with no word counts and no pressure. Entries are encrypted before they leave your device.",
  },
  {
    icon: Waves,
    title: "Mood analysis",
    body: "Every entry is read for tone and intensity, so a hard Tuesday is recorded as a hard Tuesday — not a number you invented.",
  },
  {
    icon: HeartHandshake,
    title: "Emotion detection",
    body: "Names the feelings underneath the words: relief, resentment, anticipation. Naming is often where the relief starts.",
  },
  {
    icon: Sparkles,
    title: "Reflection generation",
    body: "A short written response to what you wrote. Never advice you didn't ask for, never a diagnosis.",
  },
  {
    icon: LineChart,
    title: "Mood timeline",
    body: "Weeks and months laid out plainly, so slow shifts become visible long before they become obvious.",
  },
  {
    icon: CalendarCheck,
    title: "Daily streaks",
    body: "Gentle continuity, not guilt. Miss a day and the streak waits for you instead of resetting to zero.",
  },
  {
    icon: MessagesSquare,
    title: "AI assistant",
    body: "Ask about your own history — “when do I sleep worst?” — and get an answer grounded only in your entries.",
  },
  {
    icon: LayoutDashboard,
    title: "Personal dashboard",
    body: "One quiet page holding your streak, your trends, and the insights worth returning to.",
  },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="What's inside"
        title="Everything you need to notice yourself."
        description="Eight considered pieces that work as one practice. Nothing gamified, nothing shouting for attention."
      />

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, i) => (
          <Reveal key={feature.title} delay={(i % 4) * 0.06}>
            <article className="group h-full bg-background p-8 transition-colors duration-500 hover:bg-surface-warm">
              <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary transition-transform duration-500 group-hover:-translate-y-0.5">
                <feature.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-6 font-display text-xl">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
