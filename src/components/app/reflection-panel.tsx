import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookMarked, Heart, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { useAuth } from "@/hooks/useAuth";

interface Highlight {
  phrase: string;
  note: string;
}

interface ReflectionState {
  title: string;
  body: string[];
  question: string;
  highlights: Highlight[];
  sources: string[];
}

const defaultReflection: ReflectionState = {
  title: "Thursday Reflection",
  body: [
    "You described your workload as fine, yet there is a subtle undercurrent of pressure. It feels like avoidance rather than workload itself.",
    "Mindfulness is about tuning in to these small signals without judgment. Sit with this feeling tonight."
  ],
  question: "What is one small thing you can step back from tomorrow?",
  highlights: [
    { phrase: "Work pressure", note: "Avoidance of fatigue, not workload capacity" },
    { phrase: "Sleep pattern", note: "Quiet evening screen time before bed" }
  ],
  sources: ["journal entry 148", "weekly summary"]
};

export function ReflectionPanel() {
  const { isAuthenticated } = useAuth();
  const [reflection, setReflection] = useState<ReflectionState>(defaultReflection);
  const [isLanded, setIsLanded] = useState<boolean | null>(null);

  useEffect(() => {
    const loadAnalysis = () => {
      if (typeof window === "undefined") return;
      const cached = localStorage.getItem("mc_latest_analysis");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.reflection) {
            // Split reflection text by newlines into paragraphs
            const paragraphs = data.reflection
              .split("\n")
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0);

            // Map themes or suggestions into highlights
            const themesList: string[] = data.themes || [];
            const mappedHighlights = themesList.map((t: string) => {
              const parts = t.split(":");
              return {
                phrase: parts[0]?.trim() || "Observed Theme",
                note: parts[1]?.trim() || t,
              };
            });

            setReflection({
              title: "AI Analysis Reflection",
              body: paragraphs.length > 0 ? paragraphs : ["No reflection text generated."],
              question: data.follow_up_questions?.[0] || "How does this write-up feel to you?",
              highlights: mappedHighlights.length > 0 ? mappedHighlights : [
                { phrase: "Primary Mood", note: `Marked as ${data.primary_mood || "unknown"} (confidence ${(data.confidence * 100).toFixed(0)}%)` }
              ],
              sources: ["AI Pipeline", `analysis status: ${data.status}`]
            });
          }
        } catch (e) {
          console.error("Failed to parse cached analysis", e);
        }
      }
    };

    // Listen for storage event to update in real-time when analysis finishes
    loadAnalysis();
    
    // Add custom event listener for manual cache updates
    window.addEventListener("mc_analysis_updated", loadAnalysis);
    return () => {
      window.removeEventListener("mc_analysis_updated", loadAnalysis);
    };
  }, []);

  const handleRewrite = () => {
    toast.info("Please request a rewrite from the Journal Editor by clicking 'Analyze & Reflect'.");
  };

  const handleLanded = (landed: boolean) => {
    setIsLanded(landed);
    toast.success(landed ? "Glad this was helpful!" : "Thanks for the feedback. AI models will adjust.");
  };

  return (
    <AppFrame
      active="reflections"
      title={reflection.title}
      subtitle="Reflective insight generated from your latest entry"
      action={
        <span className="flex items-center gap-3 text-[0.7rem] text-muted-foreground">
          <button
            onClick={handleRewrite}
            className="flex cursor-default items-center gap-1.5 hover:text-foreground"
          >
            <RefreshCw aria-hidden className="size-3.5" strokeWidth={1.6} /> Re-analyze
          </button>
          <span className="flex items-center gap-1.5 cursor-default">
            <BookMarked aria-hidden className="size-3.5" strokeWidth={1.6} /> Private copy
          </span>
        </span>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl bg-paper p-6 sm:p-8 border border-border/70">
          {reflection.body.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 + i * 0.35, ease: EASE }}
              className="mb-5 font-display text-[1.02rem] leading-[1.95rem] text-foreground/90 last:mb-0 sm:text-[1.1rem] sm:leading-[2.1rem]"
            >
              {p}
            </motion.p>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 1.4, ease: EASE }}
            className="mt-7 border-t border-border/70 pt-6"
          >
            <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              A question to sit with
            </p>
            <p className="mt-3 font-display text-lg italic leading-relaxed text-primary">
              {reflection.question}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLanded(true)}
                className={`soft-press inline-flex cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide ${isLanded === true ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary'}`}
              >
                <Heart aria-hidden className="size-3" strokeWidth={1.8} /> This landed
              </button>
              <button
                type="button"
                onClick={() => handleLanded(false)}
                className={`soft-press inline-flex cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide ${isLanded === false ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground hover:bg-border/70'}`}
              >
                Not quite
              </button>
            </div>
          </motion.div>
        </article>

        <aside className="space-y-3">
          <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
            What it read
          </p>
          {reflection.highlights.map((h, i) => (
            <motion.div
              key={h.phrase + i}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 + i * 0.25, ease: EASE }}
              className="card-lift rounded-2xl border border-border/70 bg-surface-warm p-4"
            >
              <p className="font-display text-[0.95rem] leading-relaxed text-foreground/85">
                <span className="bg-primary-soft px-1 py-0.5">“{h.phrase}”</span>
              </p>
              <p className="mt-2.5 text-[0.72rem] text-muted-foreground">{h.note}</p>
            </motion.div>
          ))}
          <p className="pt-2 text-[0.7rem] text-muted-foreground">
            Drawn from {reflection.sources.join(", ")}.
          </p>
        </aside>
      </div>
    </AppFrame>
  );
}
