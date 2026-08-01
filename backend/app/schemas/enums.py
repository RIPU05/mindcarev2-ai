from enum import StrEnum


class UserStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"
    DELETED = "deleted"


class JournalSource(StrEnum):
    MANUAL = "manual"
    IMPORTED = "imported"
    VOICE = "voice"


class AnalysisInputType(StrEnum):
    TEXT = "text"
    AUDIO = "audio"
    JOURNAL = "journal"


class AnalysisStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(StrEnum):
    UNKNOWN = "unknown"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class AssistantRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class StreakType(StrEnum):
    JOURNAL = "journal"
    MOOD_CHECKIN = "mood_checkin"


class AIProvider(StrEnum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    MISTRAL = "mistral"
    GROQ = "groq"
    OPEN_SOURCE = "open_source"
    INTERNAL = "internal"


class AIStage(StrEnum):
    SAFETY_SCREENING = "safety_screening"
    EMOTION_ANALYSIS = "emotion_analysis"
    REFLECTION_GENERATION = "reflection_generation"
