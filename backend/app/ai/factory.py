from functools import lru_cache

from app.ai.exceptions import AIProviderError
from app.ai.providers.anthropic import AnthropicProvider
from app.ai.providers.base import AIProvider
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.groq import GroqProvider
from app.ai.providers.ollama import OllamaProvider
from app.ai.providers.openai import OpenAIProvider
from app.ai.registry import get_provider_builder, register_provider
from app.core.config import settings


register_provider("gemini", lambda: GeminiProvider())
register_provider("openai", lambda: OpenAIProvider())
register_provider("claude", lambda: AnthropicProvider())
register_provider("anthropic", lambda: AnthropicProvider())
register_provider("groq", lambda: GroqProvider())
register_provider("ollama", lambda: OllamaProvider())


@lru_cache
def get_ai_provider(provider_name: str | None = None) -> AIProvider:
    selected = (provider_name or settings.default_ai_provider).lower()
    builder = get_provider_builder(selected)
    if builder is None:
        raise AIProviderError(f"AI provider '{selected}' is not registered.")
    return builder()
