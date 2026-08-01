/**
 * Realistic product data for the MindCare application surfaces.
 * Everything here is written as if it came out of a real account —
 * no lorem ipsum, no placeholder labels.
 */

export const user = {
  name: "Nora Ellinger",
  handle: "nora",
  initials: "NE",
  joined: "March 2024",
  entries: 148,
  streak: 11,
  timezone: "Europe/Berlin",
  plan: "Personal · renews 4 Mar",
};

export type MoodKey = "low" | "flat" | "steady" | "warm" | "bright";

export const moodMeta: Record<MoodKey, { label: string; token: string }> = {
  low: { label: "Heavy", token: "var(--color-accent)" },
  flat: { label: "Flat", token: "var(--color-border)" },
  steady: { label: "Steady", token: "var(--color-secondary)" },
  warm: { label: "Warm", token: "var(--color-primary)" },
  bright: { label: "Light", token: "var(--color-primary-deep)" },
};

export const entry = {
  no: 148,
  title: "Thursday, quiet underneath",
  date: "Thursday 6 February · 9:42 pm",
  words: 214,
  minutes: 6,
  location: "Kitchen table",
  tags: ["work", "family", "sleep"],
  paragraphs: [
    "Today was strange. Busy, but quiet underneath it all. I got through the Almeida deck and nobody asked for changes, which should have felt like a win and mostly felt like nothing.",
    "I stayed until half seven again. Not because the work needed it — I think I just didn't want to come home to an empty flat and decide what to do with the evening.",
    "Called Mum on the walk back. Twelve minutes about nothing, her neighbour's dog, the boiler. I felt lighter for the rest of the night, which is annoying and also probably the most useful thing I learned today.",
  ],
};

export const highlights = [
  { phrase: "should have felt like a win and mostly felt like nothing", note: "Flattened reward — third time this month" },
  { phrase: "didn't want to come home to an empty flat", note: "Avoidance, not workload" },
  { phrase: "I felt lighter for the rest of the night", note: "Connection lifted the evening" },
];

export const reflection = {
  title: "On staying late",
  body: [
    "You noticed something important tonight: the work isn't only about the deadline.",
    "When you wrote about calling your mum, the tone of your entry changed — shorter sentences, less defending yourself. That's the second time this month a small connection has quietly rescued an evening.",
    "Nothing here needs fixing. It might just be worth seeing whether the quiet, rather than the workload, is the thing you're staying late to avoid.",
  ],
  question: "What would make coming home feel less like an empty room?",
  sources: ["6 Feb", "22 Jan", "14 Jan"],
};

/** 14 recent entries — value 1–10, with the mood band. */
export const moodSeries: { day: string; value: number; mood: MoodKey }[] = [
  { day: "24 Jan", value: 4.2, mood: "low" },
  { day: "25 Jan", value: 4.8, mood: "flat" },
  { day: "27 Jan", value: 4.0, mood: "low" },
  { day: "28 Jan", value: 5.5, mood: "flat" },
  { day: "29 Jan", value: 5.1, mood: "flat" },
  { day: "31 Jan", value: 6.2, mood: "steady" },
  { day: "1 Feb", value: 5.8, mood: "steady" },
  { day: "2 Feb", value: 7.1, mood: "warm" },
  { day: "3 Feb", value: 6.6, mood: "steady" },
  { day: "4 Feb", value: 7.6, mood: "warm" },
  { day: "5 Feb", value: 7.4, mood: "warm" },
  { day: "6 Feb", value: 8.2, mood: "bright" },
  { day: "7 Feb", value: 7.9, mood: "warm" },
  { day: "8 Feb", value: 8.6, mood: "bright" },
];

export const weeklyInsights = [
  {
    stat: "4 of 7",
    label: "evenings written before 10 pm",
    detail: "Up from 1 last week. Entries written earlier read calmer.",
  },
  {
    stat: "+1.3",
    label: "average mood shift after writing",
    detail: "Measured between your first and last line, across 6 entries.",
  },
  {
    stat: "3×",
    label: "\u201cempty flat\u201d appeared",
    detail: "Tue, Thu and Sun. Always after a day you called productive.",
  },
];

export const themes = [
  { name: "Work pressure", share: 34, tone: "accent" },
  { name: "Family", share: 26, tone: "primary" },
  { name: "Sleep", share: 18, tone: "secondary" },
  { name: "Friendship", share: 14, tone: "primary" },
  { name: "Money", share: 8, tone: "border" },
] as const;

/** February 2025 grid: 1st is a Saturday. */
export const calendarMonth = {
  label: "February",
  year: 2025,
  offset: 5,
  days: 28,
  written: {
    1: "steady", 2: "warm", 4: "flat", 5: "low", 6: "bright", 7: "warm",
    9: "steady", 10: "steady", 11: "low", 12: "warm", 14: "bright",
    15: "warm", 16: "steady", 18: "flat", 19: "steady", 20: "warm",
    21: "bright", 22: "warm", 24: "steady", 25: "flat", 26: "warm",
    27: "bright", 28: "warm",
  } as Record<number, MoodKey>,
  today: 6,
};

export const conversation = [
  { from: "you" as const, time: "9:58 pm", text: "I keep saying yes to things I don't want to do." },
  {
    from: "mindcare" as const,
    time: "9:58 pm",
    text: "You wrote something close to this on 14 January. Back then you said yes felt cheaper than explaining. Does that still fit?",
    cite: "Entry 131 · 14 Jan",
  },
  { from: "you" as const, time: "10:01 pm", text: "Yes. Explaining feels like asking permission." },
  {
    from: "mindcare" as const,
    time: "10:01 pm",
    text: "Then maybe the practice isn't saying no. It's letting an answer stand without a reason attached to it.",
    prompts: ["Try that this week", "Write about it", "Not tonight"],
  },
];

export const timeline = [
  { date: "6 Feb", title: "Thursday, quiet underneath", mood: "bright" as MoodKey, excerpt: "Busy, but quiet underneath it all…" },
  { date: "5 Feb", title: "Half a good day", mood: "warm" as MoodKey, excerpt: "Slept through the alarm and it didn't ruin it…" },
  { date: "4 Feb", title: "Kitchen table, late", mood: "warm" as MoodKey, excerpt: "Nina came round with soup and stayed…" },
  { date: "3 Feb", title: "Nothing much", mood: "steady" as MoodKey, excerpt: "A flat Monday. Wrote three lines and stopped…" },
];

export const settingsGroups = [
  {
    group: "Privacy",
    items: [
      { label: "End-to-end encryption", detail: "Entries are encrypted on this device", value: true },
      { label: "Lock with Face ID", detail: "Ask every time the app opens", value: true },
      { label: "Use entries to improve models", detail: "Off. Always off by default.", value: false },
    ],
  },
  {
    group: "Reflections",
    items: [
      { label: "Nightly reflection", detail: "Written 20 minutes after your entry", value: true },
      { label: "Weekly letter", detail: "Sunday morning, 8:00", value: true },
      { label: "Pattern nudges", detail: "Only when something repeats 3+ times", value: false },
    ],
  },
];
