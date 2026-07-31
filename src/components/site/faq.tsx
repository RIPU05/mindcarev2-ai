import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, Section, SectionHeading } from "@/components/site/section";

const faqs = [
  {
    q: "Can anyone at MindCare read my journal?",
    a: "No. Entries are encrypted with a key tied to your account, and our team has no mechanism to read them. Support can see billing and account metadata only.",
  },
  {
    q: "Is this a replacement for therapy?",
    a: "No, and we won't pretend otherwise. MindCare is a reflective writing practice. Many people use it alongside therapy; several bring their monthly export to sessions.",
  },
  {
    q: "What happens if I write something worrying?",
    a: "Every entry passes a safety screen. If it detects signs of crisis, MindCare pauses the usual reflection and shows region-appropriate human support lines first.",
  },
  {
    q: "Is my writing used to train AI models?",
    a: "Never. Your entries are not used for training, fine-tuning, evaluation, or advertising — by us or by any provider we work with.",
  },
  {
    q: "What if I miss a few days?",
    a: "Nothing happens. Your streak pauses rather than resets, and there are no notifications designed to make you feel behind.",
  },
  {
    q: "Can I export or delete everything?",
    a: "Yes. Export your complete archive as Markdown or PDF at any time, and permanent deletion removes entries from backups within thirty days.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions worth asking before you write anything down."
        />
        <Reveal delay={0.08}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-border">
                <AccordionTrigger className="py-6 text-left font-display text-lg font-normal hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 pr-6 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
