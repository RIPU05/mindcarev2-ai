from abc import ABC, abstractmethod

from app.rag.types import BuiltPrompt, ContextWindow, RetrievalSource


class RAGPromptBuilder(ABC):
    @abstractmethod
    async def build(self, context: ContextWindow) -> BuiltPrompt:
        """Build the final system and user prompts for the AI provider."""


class DefaultRAGPromptBuilder(RAGPromptBuilder):
    async def build(self, context: ContextWindow) -> BuiltPrompt:
        journals = []
        reflections = []
        moods = []
        chats = []

        for doc in context.documents:
            src = doc.document.source
            text = doc.document.text
            created = (
                doc.document.created_at.strftime("%Y-%m-%d %H:%M")
                if doc.document.created_at
                else "Unknown Date"
            )
            if src == RetrievalSource.JOURNAL:
                journals.append(f"[{created}] {text}")
            elif src == RetrievalSource.REFLECTION:
                reflections.append(f"[{created}] Reflection: {text}")
            elif src == RetrievalSource.MOOD:
                moods.append(f"[{created}] {text}")
            elif src == RetrievalSource.CONVERSATION:
                chats.append(text)

        memory_lines = [mem.text for mem in context.memories]

        system_prompt = (
            "You are MindCare AI, a supportive, clinically careful AI mental health companion.\n"
            "Analyze the provided context (journal history, AI reflections, mood history, and memory) "
            "to understand the user's situation. Respond in a warm, gentle, and empathetic tone.\n"
            "Guidelines:\n"
            "- Focus on the user's immediate emotional needs.\n"
            "- Reference past journal entries and reflections only if relevant to show continuity and understanding.\n"
            "- Always prioritize safety. If crisis signs are present, gently guide the user to professional help.\n"
            "- Do not diagnose or prescribe treatment. Provide gentle coping suggestions.\n"
            "- Keep your response structured as a JSON object with: 'summary', 'reflection', 'suggestions' (array of strings), "
            "and 'follow_up_questions' (array of strings)."
        )

        user_prompt_parts = []

        if journals:
            user_prompt_parts.append("### Relevant Past Journal Entries:\n" + "\n".join(journals))

        if reflections:
            user_prompt_parts.append("### Past AI Reflections:\n" + "\n".join(reflections))

        if moods:
            user_prompt_parts.append("### Mood History Logs:\n" + "\n".join(moods))

        if chats:
            # Chronological order is user-friendly, since we listed them from db sorted desc, let's reverse them
            user_prompt_parts.append("### Previous Chat Messages:\n" + "\n".join(reversed(chats)))

        if memory_lines:
            user_prompt_parts.append("### Summarized Memory Context:\n" + "\n".join(memory_lines))

        user_prompt_parts.append(f"### Current Message:\n{context.question}")

        user_prompt = "\n\n".join(user_prompt_parts)

        return BuiltPrompt(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context=context,
        )
