import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppFrame, Pill } from "@/components/app/app-frame";
import { EASE } from "@/components/story/primitives";
import { useAssistantConversations, useAssistantMessages, useAssistantChat } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export function AssistantScreen() {
  const { isAuthenticated } = useAuth();
  const { data: conversations } = useAssistantConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const { data: messagesData, isLoading: isLoadingMessages } = useAssistantMessages(activeConvId || undefined);
  const chatMutation = useAssistantChat();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Set the most recent conversation on mount
  useEffect(() => {
    if (conversations?.items && conversations.items.length > 0 && !activeConvId) {
      setActiveConvId(conversations.items[0].id);
    }
  }, [conversations, activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    if (!isAuthenticated) {
      toast.error("Please login to talk to the AI companion.");
      return;
    }

    const userMessage = inputVal;
    setInputVal("");

    try {
      const res = await chatMutation.mutateAsync({
        message: userMessage,
        conversation_id: activeConvId,
        journal_id: null,
      });
      if (!activeConvId && res.conversation_id) {
        setActiveConvId(res.conversation_id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  // Default welcome message when there is no history
  const messages = messagesData?.items || [];
  
  return (
    <AppFrame
      active="talk"
      title="Talking it through"
      subtitle="Reflective conversation with your personal AI companion"
    >
      <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 pb-4">
        {messages.length === 0 && !isLoadingMessages && (
          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/70 bg-primary-soft p-5"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                MindCare
              </p>
            </div>
            <p className="mt-3 font-display text-[1rem] leading-[1.85rem] text-foreground/90 sm:text-[1.08rem] sm:leading-[2rem]">
              Hello! I'm your private AI companion. How are you feeling tonight? Type below to explore your thoughts.
            </p>
          </motion.article>
        )}

        {messages.map((m, i) => (
          <motion.article
            key={m.id || i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className={
              m.role === "user"
                ? "rounded-2xl border border-border/70 bg-paper p-5 sm:p-6"
                : "rounded-2xl border border-border/70 bg-primary-soft p-5 sm:p-6"
            }
          >
            <div className="flex items-baseline justify-between">
              <p className="text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                {m.role === "user" ? "You" : "MindCare"}
              </p>
              <p className="text-[0.66rem] text-muted-foreground">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p className="mt-3 font-display text-[1rem] leading-[1.85rem] text-foreground/90 sm:text-[1.08rem] sm:leading-[2rem] whitespace-pre-wrap">
              {m.content}
            </p>
          </motion.article>
        ))}

        {chatMutation.isPending && (
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border/70 bg-primary-soft p-5 flex items-center gap-2"
          >
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-[0.82rem] text-muted-foreground">MindCare is writing...</span>
          </motion.article>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2 pl-5 focus-within:ring-1 focus-within:ring-primary transition-all">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Say a little more…"
            className="flex-1 bg-transparent text-[0.88rem] focus:outline-none text-foreground"
          />
          <button
            type="submit"
            disabled={chatMutation.isPending || !inputVal.trim()}
            className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-default disabled:opacity-50"
          >
            <ArrowUp aria-hidden className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      </form>

      <p className="pt-2 text-[0.7rem] text-muted-foreground">
        MindCare is an AI assistant, not a clinical therapy service. If you are in crisis, please seek immediate help.
      </p>
    </AppFrame>
  );
}
