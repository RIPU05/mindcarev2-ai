import { Chapter, ChapterTitle, FadeIn, Lede } from "@/components/story/primitives";
import { MoodTimeline } from "@/components/app/mood-timeline";
import { WeeklyInsights } from "@/components/app/weekly-insights";
import { JournalCalendar } from "@/components/app/journal-calendar";

export function Growth() {
  return (
    <Chapter id="growth" index="V" label="Over time" tone="paper">
      <div className="max-w-2xl">
        <FadeIn>
          <ChapterTitle>
            One entry is a night.
            <span className="block italic text-primary">Ninety are a pattern.</span>
          </ChapterTitle>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Nothing to beat, nothing to optimise. Just the shape your months
            actually made.
          </p>
        </FadeIn>
      </div>

      <div className="mt-20 space-y-10">
        <MoodTimeline />
        <WeeklyInsights />
        <JournalCalendar />
      </div>
    </Chapter>
  );
}
