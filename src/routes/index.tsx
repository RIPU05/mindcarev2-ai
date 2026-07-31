import { createFileRoute } from "@tanstack/react-router";

import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Trust } from "@/components/site/trust";
import { Features } from "@/components/site/features";
import { HowItWorks } from "@/components/site/how-it-works";
import { DashboardPreview } from "@/components/site/dashboard-preview";
import { Reflection } from "@/components/site/reflection";
import { Testimonials } from "@/components/site/testimonials";
import { Faq } from "@/components/site/faq";
import { CtaBanner } from "@/components/site/cta-banner";
import { Footer } from "@/components/site/footer";

const title = "MindCare AI — Private AI journaling for emotional wellbeing";
const description =
  "A private space to journal, understand your emotions, and see how your wellbeing changes over time. Encrypted, ad-free, never used to train AI.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Trust />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <Reflection />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
