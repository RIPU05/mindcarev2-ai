import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/section";

export function CtaBanner() {
  return (
    <section id="cta" className="px-6 pb-28 pt-8 sm:px-8">
      <Reveal className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-4xl bg-primary px-6 py-20 text-center sm:px-16 md:py-28">
          <div
            aria-hidden
            className="grain-surface pointer-events-none absolute inset-0 opacity-25"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance-tight text-3xl leading-[1.12] text-primary-foreground sm:text-4xl md:text-[2.9rem]">
              Tonight is a good night to write one honest paragraph.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-primary-foreground/75">
              Start free, keep everything private, and see what a month of small
              notes tells you. No card required.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button variant="quiet" size="pill" asChild>
                <a href="#cta">
                  Start journaling
                  <ArrowRight />
                </a>
              </Button>
              <Button
                variant="ghostLink"
                size="pill"
                className="rounded-full border border-primary-foreground/25 text-primary-foreground hover:text-primary-foreground/80"
                asChild
              >
                <a href="#features">Explore the features</a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
