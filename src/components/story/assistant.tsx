import { Chapter, FadeIn } from "@/components/story/primitives";
import { AssistantScreen } from "@/components/app/assistant-screen";

export function Assistant() {
  return (
    <Chapter id="assistant" index="VI" label="The conversation">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <FadeIn>
            <ChapterTitle>
              It talks like someone
              <span className="italic text-primary"> who remembers.</span>
            </ChapterTitle>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              No bubbles, no typing dots, no personality act. Just a slow
              exchange you can leave and return to.
            </p>
          </FadeIn>
        </div>

        <AssistantScreen />
      </div>
    </Chapter>
  );
}
