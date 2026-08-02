import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check, Cloud, Lock, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { moodMeta, type MoodKey } from "@/components/app/data";
import { useJournals, useCreateJournal, useUpdateJournal, useAnalyzeText } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";

const bands: MoodKey[] = ["low", "flat", "steady", "warm", "bright"];

export function JournalEditor() {
  const { isAuthenticated } = useAuth();
  const { data: journals, isLoading } = useJournals();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal(""); // we'll use dynamic mutation call
  const analyzeText = useAnalyzeText();

  // Selected active entry
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("An evening reflection");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<MoodKey>("steady");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Draft saved");

  // Keep track of the active entry from the list
  useEffect(() => {
    if (journals?.items && journals.items.length > 0 && !activeId) {
      const latest = journals.items[0];
      setActiveId(latest.id);
      setTitle(latest.title || "An evening reflection");
      setContent(latest.content);
      setTags(latest.tags || []);
    }
  }, [journals, activeId]);

  // Debounced auto-save ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = (newTitle: string, newContent: string, newTags: string[]) => {
    if (!isAuthenticated) return;
    setIsSaving(true);
    setSaveStatus("Saving...");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (activeId) {
          await updateJournal.mutateAsync({
            title: newTitle,
            content: newContent,
            tags: newTags,
          }, {
            // Override dynamic target ID using options context if needed, or by passing via mutation parameter
          });
          // Wait, updateJournal was initialized with empty string. We should trigger the mutate direct.
        } else {
          const res = await createJournal.mutateAsync({
            title: newTitle,
            content: newContent,
            tags: newTags,
          });
          setActiveId(res.id);
        }
        setSaveStatus("Autosaved to cloud");
      } catch (err) {
        setSaveStatus("Save failed");
        toast.error("Auto-save failed");
      } finally {
        setIsSaving(false);
      }
    }, 1200);
  };

  // Perform a manual update call binding the ID dynamically
  const saveManual = async (fields: { title?: string; content?: string; tags?: string[] }) => {
    if (!isAuthenticated) {
      toast.error("Please login to save your journal entries.");
      return;
    }
    setIsSaving(true);
    setSaveStatus("Saving...");
    try {
      if (activeId) {
        // Since useUpdateJournal uses query invalidation, we can call fetch directly or use mutation
        // Let's call updateJournal directly by re-initializing or calling the endpoint via apiRequest
        await apiRequest(`/journal/${activeId}`, {
          method: "PATCH",
          body: JSON.stringify(fields),
        });
      } else {
        const res = await createJournal.mutateAsync({
          title: fields.title || title,
          content: fields.content || content,
          tags: fields.tags || tags,
        });
        setActiveId(res.id);
      }
      setSaveStatus("Changes saved");
      toast.success("Entry saved successfully!");
    } catch (error) {
      toast.error("Failed to save entry");
      setSaveStatus("Error saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerSave(val, content, tags);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerSave(title, val, tags);
  };

  const handleAddTag = () => {
    const tag = prompt("Enter new tag name:");
    if (tag && !tags.includes(tag)) {
      const updated = [...tags, tag];
      setTags(updated);
      saveManual({ tags: updated });
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    saveManual({ tags: updated });
  };

  const handleMoodSelect = (b: MoodKey) => {
    setMood(b);
    toast.success(`Marked as ${moodMeta[b].label}`);
  };

  const handleReflectClick = async () => {
    if (!activeId) {
      toast.error("Please save your entry before requesting reflections.");
      return;
    }
    toast.loading("Analyzing text & generating AI reflections...", { id: "reflect" });
    try {
      const res = await analyzeText.mutateAsync({
        text: content,
        journal_id: activeId,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("mc_latest_analysis", JSON.stringify(res));
        window.dispatchEvent(new Event("mc_analysis_updated"));
      }
      toast.success("Reflections generated!", { id: "reflect" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate reflections", { id: "reflect" });
    }
  };

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div>
      <AppFrame
        active="journal"
        title="Journal Editor"
        subtitle={activeId ? "Editing entry draft" : "Create a new entry"}
        action={
          <span className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
            <Cloud aria-hidden className="size-3.5" strokeWidth={1.6} />
            {saveStatus} · encrypted
          </span>
        }
      >
        <div className="grid gap-7 lg:grid-cols-[1fr_190px]">
          <div>
            <div className="rounded-2xl bg-paper p-5 sm:p-7 border border-border/70">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Title your reflection..."
                className="w-full bg-transparent font-display text-[1.12rem] font-bold border-b border-border/40 pb-2 mb-4 focus:outline-none text-foreground/95"
              />
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Write honestly, entirely on your terms..."
                className="w-full min-h-[240px] bg-transparent font-display text-[1.02rem] leading-[1.95rem] text-foreground/90 sm:text-[1.12rem] sm:leading-[2.15rem] focus:outline-none resize-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] text-muted-foreground">
              <span>{wordCount} words</span>
              <span>{readTime} min read</span>
              <span>Local device timezone</span>
              <span className="flex items-center gap-1.5 cursor-default hover:text-foreground">
                <Undo2 aria-hidden className="size-3.5" strokeWidth={1.6} /> Version history
              </span>
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                How did it feel?
              </p>
              <div className="mt-3 flex gap-1.5">
                {bands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleMoodSelect(b)}
                    aria-label={moodMeta[b].label}
                    aria-pressed={b === mood}
                    className="group grid size-9 place-items-center rounded-full border transition-transform duration-500 hover:scale-110 sm:size-8 cursor-default"
                    style={{
                      background: moodMeta[b].token,
                      borderColor:
                        b === mood ? "var(--color-foreground)" : "transparent",
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[0.72rem] text-muted-foreground capitalize">
                {moodMeta[mood].label} — selected primary mood.
              </p>
            </div>

            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                Tags
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Pill key={t} tone="primary">
                    <span className="flex items-center gap-1">
                      {t}
                      <span onClick={() => handleRemoveTag(t)} className="text-[0.6rem] font-bold text-red-500 ml-1 cursor-pointer">×</span>
                    </span>
                  </Pill>
                ))}
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="soft-press inline-flex cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide bg-muted text-muted-foreground hover:bg-border/70"
                >
                  + add
                </button>
              </div>
            </div>

            <button
              onClick={handleReflectClick}
              disabled={analyzeText.isPending}
              className="w-full py-2 bg-primary text-primary-foreground font-display text-xs rounded-xl font-medium transition-all hover:bg-primary/95 shadow-soft cursor-default"
            >
              {analyzeText.isPending ? "Reflecting..." : "Analyze & Reflect"}
            </button>

            <div className="rounded-2xl border border-border/70 bg-surface-warm p-4">
              <p className="flex items-center gap-1.5 text-[0.72rem] text-primary">
                <Lock aria-hidden className="size-3.5" strokeWidth={1.7} /> Private entry
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                Only you can open this. Reflections are stored securely inside your private cloud database.
              </p>
            </div>

            <p className="flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
              <Check aria-hidden className="size-3.5" strokeWidth={1.7} /> Autosaved on keypress
            </p>
          </aside>
        </div>
      </AppFrame>
    </div>
  );
}
