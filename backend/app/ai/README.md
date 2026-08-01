# AI Provider Architecture

MindCare AI keeps provider-specific code under `app.ai` so business services can stay provider-agnostic.
Routes and orchestration use `get_ai_provider()` or the service factory instead of importing vendor
clients directly.

## Providers

Registered provider keys:

- `gemini` - default provider.
- `openai` - OpenAI chat completions.
- `claude` - Anthropic Claude messages API.
- `anthropic` - alias for Claude.
- `groq` - Groq OpenAI-compatible chat completions.
- `ollama` - local Ollama chat API.

Each provider implements `AIProvider` and normalizes vendor responses into `AIResponse` with provider,
model, latency, request id, token usage, optional cost metadata, and raw response details.

## Configuration

Gemini remains the default:

```env
DEFAULT_AI_PROVIDER=gemini
```

Switch providers without code changes:

```env
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_PROVIDER=claude
DEFAULT_AI_PROVIDER=groq
DEFAULT_AI_PROVIDER=ollama
```

Provider variables:

- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- `GROQ_API_KEY`, `GROQ_MODEL`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
- `AI_TIMEOUT`, `AI_MAX_RETRIES`

## Registry And Factory

`registry.py` owns the provider map. `factory.py` registers provider builders and selects the active
provider from `DEFAULT_AI_PROVIDER`. Adding a future provider should mean:

1. Add a class implementing `AIProvider`.
2. Register a builder in `factory.py`.
3. Add environment settings for the provider.
4. Keep route, database, and frontend contracts unchanged.

## Prompts

Shared prompt text lives in `prompts.py`. Provider-specific adapters should only be added when a
vendor requires a different request shape or JSON instruction style.

## Failover Design

The current runtime performs retry-with-backoff inside each provider for retryable HTTP failures and
rate limits. `FallbackPolicy` is defined in shared AI types for future cross-provider failover; it can
be layered into `factory.py` without changing business services.
