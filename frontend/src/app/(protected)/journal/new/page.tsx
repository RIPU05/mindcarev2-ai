"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Sparkles, Tag as TagIcon, Smile as SmileIcon, Eye, CheckCircle2, Clock } from "lucide-react";
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
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  const createJournal = useCreateJournalEntry();

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const tagsList = ["reflection", "work", "sleep", "gratitude", "mindfulness", "anxiety"];
  const moodsList = ["Calm", "Hopeful", "Focused", "Tired", "Anxious", "Grateful"];

  function handleSave() {
    if (!content.trim() || createJournal.isPending) return;
    createJournal.mutate(
      {
        title: title.trim() || "Reflection Entry",
        content: content.trim(),
        tags: [selectedTag]
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            router.push("/journal");
          }, 800);
        }
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <PageMotion>
      <PageHeader
        title="Zen Reflection"
        eyebrow="Express your thoughts in a safe, distraction-free space"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsZenMode(!isZenMode)}
              aria-label="Toggle Zen Focus Mode"
              className="gap-2"
            >
              <Eye className="size-4" />
              <span>{isZenMode ? "Exit Zen Mode" : "Zen Focus"}</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={createJournal.isPending || !content.trim()}
              aria-label="Save Reflection Entry"
              className="gap-2"
            >
              <Save className="size-4" />
              <span>{createJournal.isPending ? "Saving..." : "Save Entry"}</span>
            </Button>
          </div>
        }
      />

      {isSuccess && (
        <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">Reflection saved securely to your journal! Redirecting...</span>
        </div>
      )}

      {createJournal.isError ? (
        <div className="mb-6">
          <InlineError error={createJournal.error} onRetry={() => createJournal.reset()} />
        </div>
      ) : null}

      <div className={`grid gap-6 transition-all duration-300 ${isZenMode ? "grid-cols-1 max-w-4xl mx-auto" : "lg:grid-cols-[1fr_320px]"}`}>
        {/* Editor Area */}
        <Card className={`min-h-[620px] flex flex-col p-8 glass-panel border border-stone-200/80 dark:border-slate-800 transition-all duration-300 ${isZenMode ? "shadow-2xl ring-2 ring-emerald-500/20" : ""}`}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Entry Title (optional)"
            className="border-0 bg-transparent px-0 text-2xl font-extrabold shadow-none focus:ring-0 placeholder:text-stone-400 dark:placeholder:text-stone-600 text-stone-900 dark:text-stone-100"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-6 flex-1 w-full resize-none bg-transparent text-base leading-8 outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600 text-stone-800 dark:text-stone-200"
            placeholder="What feels true right now? Write freely without judgment... (Press Cmd+Enter or Ctrl+Enter to save)"
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/70 pt-4 text-xs font-semibold text-stone-400 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="size-3.5" /> AI Reflection Enabled
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {readTime} min read
              </span>
              <span>
                {wordCount} words &nbsp;•&nbsp; {charCount} / 4,000 chars
              </span>
            </div>
          </div>
        </Card>

        {/* Sidebar Metadata (Hidden in Zen Mode) */}
        {!isZenMode && (
          <aside className="space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <SmileIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Primary Mood</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {moodsList.map((m) => (
                  <button key={m} onClick={() => setSelectedMood(m)} aria-label={`Select mood ${m}`}>
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
                  <button key={t} onClick={() => setSelectedTag(t)} aria-label={`Select tag ${t}`}>
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
        )}
      </div>
    </PageMotion>
  );
}

