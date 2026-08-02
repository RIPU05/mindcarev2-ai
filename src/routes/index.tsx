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
import { Questions } from "@/components/story/questions";
import { Chapter } from "@/components/story/primitives";
import { JournalEditor } from "@/components/app/journal-editor";
import { ReflectionPanel } from "@/components/app/reflection-panel";
import { ProfileScreen } from "@/components/app/profile-screen";
import { SettingsScreen } from "@/components/app/settings-screen";


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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: EASE }}
      className="min-h-screen bg-background"
    >
      <StoryChrome />
      <main>
        <Opening />
        <Seam from="base" to="paper" />
        <Writing />
        <Chapter id="editor" label="The editor">
          <JournalEditor />
        </Chapter>
        <Seam from="paper" to="base" />
        <Reading />
        <Seam from="base" to="paper" />
        <Emotions />
        <Seam from="paper" to="base" />
        <ReflectionLetter />
        <Chapter id="reflection-panel" label="The reflection panel">
          <ReflectionPanel />
        </Chapter>
        <Seam from="base" to="paper" />
        <Growth />
        <Seam from="paper" to="base" />
        <Assistant />
        <Seam from="base" to="deep" height={180} />
        <Privacy />
        <Seam from="deep" to="paper" height={180} />
        <Chapter id="settings" label="Your account" tone="paper">
          <div className="space-y-10">
            <SettingsScreen />
            <ProfileScreen />
          </div>
        </Chapter>
        <Seam from="paper" to="base" />
        <Questions />
        <Closing />


      </main>
      <StoryFooter />
    </motion.div>
  );

}
