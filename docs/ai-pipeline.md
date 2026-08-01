# AI Pipeline Architecture

The AI pipeline is designed as independent stages connected by typed contracts.

```text
Journal
  -> Safety Screening
  -> Emotion Analysis
  -> Mood Analysis
  -> Reflection Generation
  -> Suggestions
  -> Follow-up Questions
  -> Dashboard
```

## Stages

- Journal: canonical user input, including text and optional media references.
- Safety Screening: identifies crisis or high-risk signals and produces a risk classification.
- Emotion Analysis: extracts mood and emotion scores from approved input.
- Mood Analysis: normalizes the primary mood, confidence, and persisted mood history fields.
- Reflection Generation: creates supportive summaries, themes, suggestions, and follow-up questions.
- Suggestions: stores practical next-step suggestions inside provider metadata for the analysis.
- Follow-up Questions: stores reflective prompts inside provider metadata for the analysis.
- Dashboard: aggregates moods, streaks, journal counts, and trends from persisted results.

Each stage should be replaceable, testable, and observable. Provider-specific SDK calls belong in adapters, not in route handlers or abstract service packages.

## Gemini Provider

Gemini is the default implementation. Provider-specific code lives in `backend/app/ai`, while
service adapters live beside the existing `safety`, `emotion`, `reflection`, and `orchestration`
interfaces.

Configure Gemini with environment variables:

- `DEFAULT_AI_PROVIDER=gemini`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `OLLAMA_BASE_URL`
- `AI_TIMEOUT`
- `AI_MAX_RETRIES`

Provider, model, latency, request id, token usage, processing status, processing start time, and
processing completion time are persisted in the existing `provider_metadata` JSONB field on mood
analyses.

The provider registry currently supports `gemini`, `openai`, `claude`, `groq`, and `ollama`.
Switching `DEFAULT_AI_PROVIDER` changes the active provider without public API, frontend, or database
changes. Provider failover is represented by the shared `FallbackPolicy` type and can be activated in
the factory later without changing the stage contracts.

## RAG Architecture

Retrieval-Augmented Generation lives under `backend/app/rag` as typed interfaces only. It does not
change public API contracts, frontend behavior, or database schemas.

```text
User Question
  -> Semantic Search
  -> Relevant Memories
  -> Prompt Builder
  -> AI Provider
  -> Final Response
```

### Embedding Flow

`EmbeddingProvider` defines `embed_text` and `embed_batch` for future Gemini Embeddings, OpenAI
Embeddings, Voyage AI, and Ollama embedding adapters. Embedding provider selection should be
configuration-driven and wired through the RAG factory when concrete adapters are added.

### Retrieval Flow

Source-specific retriever interfaces cover journal, reflection, mood, and conversation retrieval.
`CompositeRetriever` will combine source results for a user question before memory and prompt
construction.

### Vector Storage

`VectorStore` abstracts vector upsert, semantic search, and deletion. Planned stores are pgvector,
Pinecone, Qdrant, and Chroma. pgvector can reuse PostgreSQL and Alembic later when schema changes are
explicitly approved.

### Memory

The RAG contracts separate short-term conversation memory from long-term memory. `MemorySummarizer`
defines the compression step for turning retrieved or recent context into compact memory items.

### Prompt Construction

`ContextWindowBuilder` is responsible for selecting memories and retrieved documents within a token
budget. `RAGPromptBuilder` converts the bounded context into provider-ready prompts, then generation
continues through the existing AI provider registry and factory.
