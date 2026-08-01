# RAG Architecture

This package defines the Retrieval-Augmented Generation architecture for MindCare AI. It contains
interfaces and typed contracts only; business retrieval logic, persistence, indexing, and public API
changes belong in later implementation work.

## Pipeline

```text
User Question
  -> Semantic Search
  -> Relevant Memories
  -> Prompt Builder
  -> AI Provider
  -> Final Response
```

## Embeddings

`EmbeddingProvider` normalizes future embedding providers behind `embed_text` and `embed_batch`.
Planned providers:

- Gemini Embeddings
- OpenAI Embeddings
- Voyage AI
- Ollama embeddings

## Retrieval

Retrievers are source-specific interfaces for:

- Journal retrieval
- Reflection retrieval
- Mood retrieval
- Conversation retrieval

`CompositeRetriever` will coordinate multiple retrievers for a single user question.

## Vector Storage

`VectorStore` abstracts vector persistence and semantic search. Planned backends:

- pgvector
- Pinecone
- Qdrant
- Chroma

No database schema changes are introduced here. A future pgvector adapter can reuse PostgreSQL and
Alembic when schema work is approved.

## Memory

Memory is split by lifetime:

- Short-term conversation memory through `ConversationMemory`.
- Long-term memory through `LongTermMemory`.
- Compression through `MemorySummarizer`.

## Prompt Construction

`ContextWindowBuilder` is responsible for fitting search results and memories into a bounded context.
`RAGPromptBuilder` converts that context into provider-ready system and user prompts. Final generation
continues to use the existing AI provider registry and factory.

## Scalability

The RAG package is intentionally adapter-first: vector stores, embedding providers, and memory
backends can be swapped without changing route handlers, frontend contracts, or AI provider clients.
