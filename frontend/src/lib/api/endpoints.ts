export const apiEndpoints = {
  health: "/health",
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    me: "/auth/me"
  },
  journal: "/journal",
  analysis: {
    text: "/analysis/text",
    audio: "/analysis/audio"
  },
  moods: "/moods",
  dashboardSummary: "/dashboard/summary",
  assistantChat: "/assistant/chat",
  profile: "/profile"
} as const;

