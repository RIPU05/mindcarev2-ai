import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";

// Interfaces to mirror backend response structures
export interface ProfileData {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  created_at: string;
}

export interface DashboardSummary {
  journal_count: number;
  mood_count: number;
  latest_mood: string | null;
  risk_level: string;
}

export interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  source: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface JournalListResponse {
  items: JournalEntry[];
  total: number;
}

export interface MoodRecord {
  id: string;
  primary_mood: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface MoodListResponse {
  items: MoodRecord[];
  total: number;
}

export interface SettingsData {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  daily_reminder_time: string;
  weekly_summary_enabled: boolean;
  theme: string;
  privacy_lock_enabled: boolean;
  e2e_encryption_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResponse {
  id: string;
  input_type: string;
  status: string;
  primary_mood: string;
  confidence: number;
  risk_level: string;
  emotions: Array<{ label: string; score: number }>;
  created_at: string;
  summary?: string;
  themes?: string[];
  reflection?: string;
  suggestions?: string[];
  follow_up_questions?: string[];
}

export interface ConversationData {
  id: string;
  title: string | null;
  status: string;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  items: ConversationData[];
  total: number;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessageListResponse {
  items: MessageData[];
  total: number;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  role: string;
  content: string;
  created_at: string;
}

// 1. Profile Query & Mutation
export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () => apiRequest<ProfileData>("/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProfileData>) =>
      apiRequest<ProfileData>("/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// 2. Dashboard Query
export function useDashboard() {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest<DashboardSummary>("/dashboard/summary"),
  });
}

// 3. Journal Queries & Mutations
export function useJournals(limit = 100) {
  return useQuery<JournalListResponse>({
    queryKey: ["journals", limit],
    queryFn: () => apiRequest<JournalListResponse>(`/journal?limit=${limit}`),
  });
}

export function useJournal(id?: string) {
  return useQuery<JournalEntry>({
    queryKey: ["journal", id],
    queryFn: () => apiRequest<JournalEntry>(`/journal/${id}`),
    enabled: !!id,
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; content: string; tags?: string[] }) =>
      apiRequest<JournalEntry>("/journal", {
        method: "POST",
        body: JSON.stringify({ ...data, source: "manual" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateJournal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; content?: string; tags?: string[] }) =>
      apiRequest<JournalEntry>(`/journal/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/journal/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// 4. Mood History Query
export function useMoodHistory(limit = 100) {
  return useQuery<MoodListResponse>({
    queryKey: ["moods", limit],
    queryFn: () => apiRequest<MoodListResponse>(`/moods?limit=${limit}`),
  });
}

// 5. Settings Query & Mutation
export function useSettings() {
  return useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: () => apiRequest<SettingsData>("/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SettingsData>) =>
      apiRequest<SettingsData>("/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// 6. Mood Analysis Trigger (Mutation)
export function useAnalyzeText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { text: string; journal_id?: string }) =>
      apiRequest<AnalysisResponse>("/analysis/text", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// 7. Assistant Queries & Mutations
export function useAssistantConversations() {
  return useQuery<ConversationListResponse>({
    queryKey: ["assistant", "conversations"],
    queryFn: () => apiRequest<ConversationListResponse>("/assistant/conversations"),
  });
}

export function useAssistantMessages(conversationId?: string) {
  return useQuery<MessageListResponse>({
    queryKey: ["assistant", "messages", conversationId],
    queryFn: () =>
      apiRequest<MessageListResponse>(
        `/assistant/conversations/${conversationId}/messages?limit=100`
      ),
    enabled: !!conversationId,
  });
}

export function useAssistantChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { message: string; conversation_id?: string | null; journal_id?: string | null }) =>
      apiRequest<ChatResponse>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assistant", "conversations"] });
      if (variables.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: ["assistant", "messages", variables.conversation_id],
        });
      }
    },
  });
}
