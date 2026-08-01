"use client";

import { Send } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { EmptyState, PageHeader } from "@/components/app/ui-patterns";
import { assistantMessages } from "@/lib/mock/app-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineError, ToastPlaceholder } from "@/components/app/api-states";
import { useAssistant } from "@/lib/api/hooks";

export default function AssistantPage() {
  const assistant = useAssistant();

  return (
    <PageMotion>
      <PageHeader title="Assistant" eyebrow="Conversation UI placeholder" />
      <div className="grid min-h-[680px] gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="hidden lg:block"><h3 className="font-semibold">Conversations</h3><div className="mt-4 space-y-2">{["Afternoon energy", "Sleep routine", "Work boundaries"].map((x) => <div key={x} className="rounded-lg bg-stone-50 p-3 text-sm dark:bg-stone-900">{x}</div>)}</div></Card>
        <Card className="flex flex-col">
          <div className="flex-1 space-y-4">
            {assistant.isError ? <InlineError error={assistant.error} onRetry={() => assistant.reset()} /> : null}
            {assistant.isSuccess ? <ToastPlaceholder message="Assistant response received from API contract." /> : null}
            {assistantMessages.length ? assistantMessages.map((m, i) => <div key={i} className={m.role === "user" ? "ml-auto max-w-lg rounded-lg bg-stone-950 p-4 text-sm text-white dark:bg-stone-100 dark:text-stone-950" : "max-w-lg rounded-lg bg-stone-100 p-4 text-sm leading-6 dark:bg-stone-900"}>{m.text}</div>) : <EmptyState title="Start a conversation" detail="Suggested prompts will appear here." />}
            {assistant.isPending ? <div className="max-w-sm rounded-lg bg-stone-100 p-3 text-sm text-stone-500 dark:bg-stone-900">Assistant is typing...</div> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-500"><span>Try:</span><span>Help me reflect</span><span>Find a pattern</span><span>Plan a calmer evening</span></div>
          <div className="mt-4 flex gap-2"><Input placeholder="Message assistant" /><Button onClick={() => assistant.mutate({ message: "Help me reflect on today." })} disabled={assistant.isPending}><Send className="size-4" /></Button></div>
        </Card>
      </div>
    </PageMotion>
  );
}
