import { Reveal, Section, SectionHeading } from "@/components/site/section";

const testimonials = [
  {
    quote:
      "I've started and abandoned six journalling apps. This is the first one that didn't feel like homework. The reflections are short enough that I actually read them.",
    name: "Amara Osei",
    role: "Paediatric nurse, Manchester",
  },
  {
    quote:
      "The timeline showed me my worst weeks always follow travel. Obvious in hindsight, invisible for four years. I now block out the Sunday after every trip.",
    name: "Daniel Reiss",
    role: "Product lead, Berlin",
  },
  {
    quote:
      "My therapist and I use my monthly export as a starting point. It means I stop spending the first fifteen minutes trying to remember how the month went.",
    name: "Priya Raman",
    role: "Doctoral researcher, Toronto",
  },
];

export function Testimonials() {
  return (
    <Section id="stories" tone="surface">
      <SectionHeading
        eyebrow="Stories"
        title="Written by people who kept coming back."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, i) => (
          <Reveal key={testimonial.name} delay={i * 0.08}>
            <figure className="flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-soft">
              <blockquote className="text-[0.98rem] leading-relaxed text-foreground/85">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-8 border-t border-border pt-5">
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {testimonial.role}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
