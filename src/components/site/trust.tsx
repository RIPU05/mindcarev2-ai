import { Lock, ShieldCheck, EyeOff, KeyRound } from "lucide-react";

import { Reveal, Section } from "@/components/site/section";

const pillars = [
  {
    icon: Lock,
    title: "Private by default",
    body: "Entries are yours alone. No human at MindCare reads them.",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted end to end",
    body: "AES-256 at rest, TLS 1.3 in transit, keys held per account.",
  },
  {
    icon: EyeOff,
    title: "Never sold or trained on",
    body: "Your writing is never used to train models or shared with advertisers.",
  },
  {
    icon: KeyRound,
    title: "Leave with everything",
    body: "Export your full archive or delete it permanently in one click.",
  },
];

export function Trust() {
  return (
    <Section tone="surface">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="eyebrow mb-5">Trusted &amp; private</p>
          <h2 className="text-balance-tight text-3xl leading-[1.14] sm:text-4xl">
            The most honest writing happens when nobody is watching.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            So we built the privacy first and the product second. Everything
            below is a default, not an upgrade.
          </p>
        </Reveal>

        <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.07}>
              <pillar.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pillar.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
