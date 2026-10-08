"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Sparkles, Tag as TagIcon, Smile as SmileIcon } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineError } from "@/components/app/api-states";
import { useCreateJournalEntry } from "@/lib/api/hooks";

export default function NewJournalPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("reflection");
  const [selectedMood, setSelectedMood] = useState("Calm");

  const router = useRouter();
  const createJournal = useCreateJournalEntry();

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const tagsList = ["reflection", "work", "sleep", "gratitude", "mindfulness", "anxiety"];
  const moodsList = ["Calm", "Hopeful", "Focused", "Tired", "Anxious", "Grateful"];

  function handleSave() {
    if (!content.trim()) return;
    createJournal.mutate(
      {
        title: title.trim() || "Reflection Entry",
        content: content.trim(),
        tags: [selectedTag]
      },
      {
        onSuccess: () => {
          router.push("/journal");
        }
      }
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="New Reflection"
        eyebrow="Express your thoughts in a safe, private space"
        action={
          <Button onClick={handleSave} disabled={createJournal.isPending || !content.trim()}>
            <Save className="size-4" /> {createJournal.isPending ? "Saving..." : "Save Entry"}
          </Button>
        }
      />

      {createJournal.isError ? (
        <div className="mb-6">
          <InlineError error={createJournal.error} onRetry={() => createJournal.reset()} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Editor Area */}
        <Card className="min-h-[620px] flex flex-col p-8 glass-panel border border-slate-200/80 dark:border-slate-800">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry Title (optional)"
            className="border-0 bg-transparent px-0 text-2xl font-extrabold shadow-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-6 flex-1 w-full resize-none bg-transparent text-base leading-8 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200"
            placeholder="What feels true right now? Write freely without judgment..."
          />

          <div className="mt-6 flex items-center justify-between border-t border-slate-200/70 pt-4 text-xs font-semibold text-slate-400 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3.5" /> AI Reflection Enabled
            </span>
            <span>
              {wordCount} words &nbsp;•&nbsp; {charCount} / 4,000 chars
            </span>
          </div>
        </Card>

        {/* Sidebar Metadata */}
        <aside className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <SmileIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Primary Mood</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {moodsList.map((m) => (
                <button key={m} onClick={() => setSelectedMood(m)}>
                  <Badge variant={selectedMood === m ? "emerald" : "default"}>{m}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <TagIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Category Tag</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsList.map((t) => (
                <button key={t} onClick={() => setSelectedTag(t)}>
                  <Badge variant={selectedTag === t ? "sky" : "default"}>#{t}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-500/20">
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Writing Prompt</h4>
            <p className="mt-2 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
              "Notice three things that brought a moment of stillness or gratitude to your day today."
            </p>
          </Card>
        </aside>
      </div>
    </PageMotion>
  );
}
