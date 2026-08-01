export type RiskLevel = "unknown" | "low" | "moderate" | "high" | "crisis";

export type DashboardSummaryResponse = {
  journal_count: number;
  mood_count: number;
  latest_mood: string | null;
  risk_level: RiskLevel;
};

export type JournalResponse = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  source: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type JournalListResponse = {
  items: JournalResponse[];
  total: number;
};

export type JournalCreateRequest = {
  title?: string | null;
  content: string;
  tags?: string[];
  source?: "manual";
};

export type MoodHistoryResponse = {
  id: string;
  primary_mood: string;
  confidence: number;
  source: string;
  created_at: string;
};

export type MoodHistoryListResponse = {
  items: MoodHistoryResponse[];
  total: number;
};

export type ProfileResponse = {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdateRequest = {
  display_name?: string | null;
  timezone?: string | null;
};

export type TextAnalysisRequest = {
  text: string;
  journal_id?: string | null;
};

export type MoodAnalysisResponse = {
  id: string;
  input_type: string;
  status: string;
  primary_mood: string;
  confidence: number;
  risk_level: RiskLevel;
  emotions: Array<{ label: string; score: number }>;
  created_at: string;
};

export type AssistantChatRequest = {
  message: string;
  conversation_id?: string | null;
  journal_id?: string | null;
};

export type AssistantChatResponse = {
  conversation_id: string;
  message_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type PageParams = {
  page?: number;
  pageSize?: number;
};
