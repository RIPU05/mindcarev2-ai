"use client";

import { CheckCircle2 } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { reflections } from "@/lib/mock/app-data";
import { InlineError, ToastPlaceholder } from "@/components/app/api-states";
import { useAnalysis } from "@/lib/api/hooks";

export default function ReflectionsPage() {
  const analysis = useAnalysis();

  return (
    <PageMotion>
      <PageHeader title="AI reflections" eyebrow="Mock analysis layout for future backend connection" />
      {analysis.isError ? <InlineError error={analysis.error} onRetry={() => analysis.reset()} /> : null}
      {analysis.isSuccess ? <ToastPlaceholder message={`Analysis status: ${analysis.data.status}`} /> : null}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <Badge>Confidence 86%</Badge>
          <h3 className="mt-4 text-xl font-semibold">Your week becomes steadier when the first hour is protected.</h3>
          <p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">The strongest signal in recent entries is the relationship between simple morning rituals and lower emotional volatility later in the day.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Key emotions</h3>
          <div className="mt-4 flex flex-wrap gap-2">{["Calm", "Relief", "Focus", "Tenderness"].map((e) => <Badge key={e}>{e}</Badge>)}</div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {["Detected themes", "Suggestions", "Follow-up questions"].map((title, idx) => (
          <Card key={title}>
            <h3 className="font-semibold">{title}</h3>
            <div className="mt-4 space-y-3">
              {reflections.map((text) => <div key={text} className="flex gap-2 text-sm text-stone-600 dark:text-stone-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />{idx === 2 ? text.replace("You", "What if you") : text}</div>)}
            </div>
          </Card>
        ))}
      </div>
    </PageMotion>
  );
}
