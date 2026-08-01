import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { StoryChrome, StoryFooter } from "@/components/story/chrome";
import { Seam, EASE } from "@/components/story/primitives";
import { Opening } from "@/components/story/opening";
import { Writing } from "@/components/story/writing";
import { Reading } from "@/components/story/reading";
import { Emotions } from "@/components/story/emotions";
import { ReflectionLetter } from "@/components/story/reflection-letter";
import { Growth } from "@/components/story/growth";
import { Assistant } from "@/components/story/assistant";
import { Privacy } from "@/components/story/privacy";
import { Closing } from "@/components/story/closing";


const title = "MindCare — the story of one journal entry";
const description =
  "A private journaling companion. Follow a single evening's entry as it is written, read, understood and remembered — quietly, and entirely on your terms.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <StoryChrome />
      <main>
        <Opening />
        <Writing />
        <Reading />
        <Emotions />
        <ReflectionLetter />
        <Growth />
        <Assistant />
        <Privacy />
        <Closing />
      </main>
      <StoryFooter />
    </div>
  );
}
