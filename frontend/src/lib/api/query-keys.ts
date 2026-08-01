export const queryKeys = {
  dashboard: () => ["dashboard"] as const,
  journalEntries: (page: number) => ["journal", "entries", page] as const,
  journalEntry: (id: string) => ["journal", "entry", id] as const,
  moodHistory: (page: number) => ["moods", "history", page] as const,
  profile: () => ["profile"] as const,
  analysis: () => ["analysis"] as const,
  assistant: (conversationId?: string) => ["assistant", conversationId ?? "new"] as const,
  settings: () => ["settings"] as const
};
