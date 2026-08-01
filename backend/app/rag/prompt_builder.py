from abc import ABC, abstractmethod

from app.rag.types import BuiltPrompt, ContextWindow


class RAGPromptBuilder(ABC):
    @abstractmethod
    async def build(self, context: ContextWindow) -> BuiltPrompt:
        """Build the final system and user prompts for the AI provider."""
