"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { apiEndpoints } from "./endpoints";
import { queryKeys } from "./query-keys";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  DashboardSummaryResponse,
  JournalCreateRequest,
  JournalListResponse,
  JournalResponse,
  MoodAnalysisResponse,
  MoodHistoryListResponse,
  PageParams,
  ProfileResponse,
  ProfileUpdateRequest,
  TextAnalysisRequest
} from "./types";

const DEFAULT_PAGE = 1;

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => apiClient.get<DashboardSummaryResponse>(apiEndpoints.dashboardSummary)
  });
}

export function useJournalEntries(params: PageParams = {}) {
  const page = params.page ?? DEFAULT_PAGE;
  return useQuery({
    queryKey: queryKeys.journalEntries(page),
    queryFn: () => apiClient.get<JournalListResponse>(apiEndpoints.journal)
  });
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: queryKeys.journalEntry(id),
    queryFn: () => apiClient.get<JournalResponse>(`${apiEndpoints.journal}/${id}`),
    enabled: Boolean(id)
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JournalCreateRequest) => apiClient.post<JournalResponse, JournalCreateRequest>(apiEndpoints.journal, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal"] })
  });
}

export function useMoodHistory(params: PageParams = {}) {
  const page = params.page ?? DEFAULT_PAGE;
  return useQuery({
    queryKey: queryKeys.moodHistory(page),
    queryFn: () => apiClient.get<MoodHistoryListResponse>(apiEndpoints.moods)
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => apiClient.get<ProfileResponse>(apiEndpoints.profile)
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdateRequest) => apiClient.patch<ProfileResponse, ProfileUpdateRequest>(apiEndpoints.profile, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile() })
  });
}

export function useAnalysis() {
  return useMutation({
    mutationKey: queryKeys.analysis(),
    mutationFn: (payload: TextAnalysisRequest) => apiClient.post<MoodAnalysisResponse, TextAnalysisRequest>(apiEndpoints.analysis.text, payload)
  });
}

export function useAssistant(conversationId?: string) {
  return useMutation({
    mutationKey: queryKeys.assistant(conversationId),
    mutationFn: (payload: AssistantChatRequest) => apiClient.post<AssistantChatResponse, AssistantChatRequest>(apiEndpoints.assistantChat, payload)
  });
}
