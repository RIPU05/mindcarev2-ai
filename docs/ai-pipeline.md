# AI Pipeline Architecture

The AI pipeline is designed as independent stages connected by typed contracts.

```text
Journal
  -> Safety Screening
  -> Emotion Analysis
  -> Reflection Generation
  -> Dashboard
```

## Stages

- Journal: canonical user input, including text and optional media references.
- Safety Screening: identifies crisis or high-risk signals and produces a risk classification.
- Emotion Analysis: extracts mood and emotion scores from approved input.
- Reflection Generation: creates supportive summaries, themes, suggestions, and follow-up questions.
- Dashboard: aggregates moods, streaks, journal counts, and trends from persisted results.

Each stage should be replaceable, testable, and observable. Provider-specific SDK calls belong in adapters, not in route handlers or abstract service packages.
