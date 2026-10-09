"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare as MessageSquareIcon, Bot, User as UserIcon, Plus, History, X } from "lucide-react";
import { PageMotion } from "@/components/app/motion";
import { PageHeader } from "@/components/app/ui-patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InlineError } from "@/components/app/api-states";
import { useAssistant } from "@/lib/api/hooks";

export default function AssistantPage() {
  const [inputMessage, setInputMessage] = useState("");
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am your MindCare AI companion. How are you feeling today? I am here to help you reflect, process emotions, or suggest gentle routines."
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistant = useAssistant();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, assistant.isPending]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileHistoryOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSendMessage(customMsg?: string) {
    const textToSend = customMsg || inputMessage.trim();
    if (!textToSend || assistant.isPending) return;

    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    if (!customMsg) setInputMessage("");

    assistant.mutate(
      { message: textToSend },
      {
        onSuccess: (data) => {
          if (data?.content) {
            setMessages((prev) => [...prev, { role: "assistant", text: data.content }]);
          }
        }
      }
    );
  }

  const lastUserText = messages.slice().reverse().find((m) => m.role === "user")?.text;

  function handleRetry() {
    assistant.reset();
    if (lastUserText) {
      assistant.mutate(
        { message: lastUserText },
        {
          onSuccess: (data) => {
            if (data?.content) {
              setMessages((prev) => [...prev, { role: "assistant", text: data.content }]);
            }
          }
        }
      );
    }
  }

  function handleSelectConversation(title: string) {
    setIsMobileHistoryOpen(false);
    setMessages([
      {
        role: "assistant",
        text: `Switched to conversation: "${title}". How can I support you with this today?`
      }
    ]);
  }

  const promptSuggestions = [
    "How is my mood trending this week?",
    "Help me process today's stress",
    "Suggest an evening calm wind-down routine",
    "How can I set healthier boundaries at work?"
  ];

  const conversationTitles = [
    "Afternoon Energy & Calm",
    "Sleep Routine Check-in",
    "Work-Life Boundaries"
  ];

  return (
    <PageMotion>
      <PageHeader
        title="AI Companion Assistant"
        eyebrow="Gentle, empathetic conversation powered by Gemini AI"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 lg:hidden"
              onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
              aria-label="Toggle chat history drawer"
            >
              <History className="size-4" />
              <span>History</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setMessages([messages[0]])}
              aria-label="Start a new conversation"
            >
              <Plus className="size-4" />
              <span>New Conversation</span>
            </Button>
          </div>
        }
      />

      {/* Mobile Drawer Overlay */}
      {isMobileHistoryOpen && (
        <div className="fixed inset-0 z-50 flex bg-stone-900/60 backdrop-blur-xs lg:hidden">
          <div className="relative flex w-4/5 max-w-xs flex-col bg-white p-6 dark:bg-stone-900">
            <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-3 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Chat History</h3>
              <button
                onClick={() => setIsMobileHistoryOpen(false)}
                className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="Close chat history drawer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {conversationTitles.map((title, i) => (
                <button
                  key={title}
                  onClick={() => handleSelectConversation(title)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-semibold cursor-pointer transition text-left ${
                    i === 0
                      ? "bg-emerald-500/10 text-emerald-900 border border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  <MessageSquareIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{title}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileHistoryOpen(false)} />
        </div>
      )}

      <div className="grid min-h-[660px] gap-6 lg:grid-cols-[300px_1fr]">
        {/* Desktop Sidebar Conversations */}
        <Card className="hidden lg:flex flex-col p-5 glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Active Conversations</h3>
            <Badge variant="emerald">Gemini 1.5</Badge>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {conversationTitles.map((title, i) => (
              <button
                key={title}
                onClick={() => handleSelectConversation(title)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-semibold cursor-pointer transition text-left ${
                  i === 0
                    ? "bg-emerald-500/10 text-emerald-900 border border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-850"
                }`}
              >
                <MessageSquareIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Main Chat Panel */}
        <Card className="flex flex-col min-h-[600px] p-6 glass-panel border border-slate-200/80 dark:border-slate-800">
          {assistant.isError ? (
            <div className="mb-4">
              <InlineError error={assistant.error} onRetry={handleRetry} />
            </div>
          ) : null}

          {/* Message Thread */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
                    <Bot className="size-5" />
                  </div>
                )}
                <div
                  className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                      : "bg-slate-100/90 text-slate-900 border border-slate-200/70 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <UserIcon className="size-5" />
                  </div>
                )}
              </div>
            ))}

            {assistant.isPending && (
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
                  <Sparkles className="size-5 animate-pulse" />
                </div>
                <div className="rounded-2xl bg-stone-100/90 p-4 text-xs font-semibold text-stone-600 dark:bg-slate-850 dark:text-stone-300 animate-pulse">
                  Gathering thoughtful insights for you...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400">Suggestions:</span>
            {promptSuggestions.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={assistant.isPending}
                aria-label={`Prompt suggestion: ${prompt}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <div className="mt-4 flex gap-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask your assistant anything about your mood or well-being..."
              className="h-12 rounded-xl text-sm"
              disabled={assistant.isPending}
              aria-label="Type message for AI assistant"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={assistant.isPending || !inputMessage.trim()}
              className="h-12 px-6"
              aria-label="Send message to AI assistant"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </PageMotion>
  );
}

