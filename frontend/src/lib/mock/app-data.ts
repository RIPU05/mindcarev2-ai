import {
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  Home,
  LineChart,
  LogOut,
  NotebookPen,
  Settings,
  UserRound
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/mood-history", label: "Mood History", icon: CalendarDays },
  { href: "/reflections", label: "AI Reflections", icon: Brain },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/logout", label: "Logout", icon: LogOut }
];

export const weeklyMood = [
  { day: "Mon", mood: 68 },
  { day: "Tue", mood: 74 },
  { day: "Wed", mood: 59 },
  { day: "Thu", mood: 72 },
  { day: "Fri", mood: 81 },
  { day: "Sat", mood: 77 },
  { day: "Sun", mood: 84 }
];

export const monthlyMood = Array.from({ length: 30 }, (_, index) => ({
  day: index + 1,
  value: [62, 70, 74, 55, 81, 76, 69, 72, 85, 64][index % 10]
}));

export const journalEntries = [
  {
    id: "morning-reset",
    title: "A softer morning reset",
    date: "Today, 8:15 AM",
    mood: "Calm",
    tone: "Grounded",
    excerpt: "I woke up before the alarm and made tea without checking messages first.",
    tags: ["routine", "sleep", "gratitude"],
    words: 642
  },
  {
    id: "work-boundaries",
    title: "Protecting focus at work",
    date: "Yesterday",
    mood: "Focused",
    tone: "Steady",
    excerpt: "The afternoon felt lighter after I blocked a quiet hour for deep work.",
    tags: ["work", "boundaries"],
    words: 914
  },
  {
    id: "evening-walk",
    title: "Evening walk notes",
    date: "Jul 29",
    mood: "Hopeful",
    tone: "Reflective",
    excerpt: "The walk helped me notice how much tension I had been carrying.",
    tags: ["movement", "reflection"],
    words: 518
  }
];

export const reflections = [
  "You seem most regulated when your day starts with low-friction rituals.",
  "Work stress rises when plans are ambiguous, then settles after you define the next action.",
  "Movement and sunlight appear consistently in your calmer entries."
];

export const assistantMessages = [
  { role: "assistant", text: "What would feel supportive to explore today?" },
  { role: "user", text: "I want help understanding why afternoons feel heavy." },
  {
    role: "assistant",
    text: "A gentle pattern to inspect: your afternoon entries mention context switching, late meals, and unclear priorities. We can unpack one of those."
  }
];

export const timeline = [
  { time: "8:15 AM", title: "Journal entry", detail: "Logged Calm with sleep and gratitude tags." },
  { time: "1:30 PM", title: "Mood check", detail: "Energy dipped after meetings." },
  { time: "6:40 PM", title: "Reflection", detail: "Evening walk connected to improved mood." }
];
