from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.exceptions import NotFoundException
from app.models.assistant import AssistantConversation, AssistantMessage
from app.models.users import User
from app.repositories.assistant import AssistantConversationRepository, AssistantMessageRepository
from app.repositories.journal import JournalRepository
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantConversationListResponse,
    AssistantConversationResponse,
    AssistantMessageListResponse,
    AssistantMessageResponse,
)
from app.schemas.common import ErrorResponse
from app.schemas.enums import AssistantRole, ConversationStatus
from app.services.ai_json import parse_json_object
from app.utils.pagination import PaginationParams

router = APIRouter(
    prefix="/assistant", tags=["assistant"], dependencies=[Depends(get_current_user)]
)

ERROR_RESPONSES: dict[int | str, dict] = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def chat(
    payload: AssistantChatRequest,
    current_user: User = Depends(get_current_user),
) -> AssistantChatResponse:
    import time
    from app.ai.limiter import user_ai_rate_limiter
    from app.core.logging import get_logger

    logger = get_logger(__name__)
    t_start = time.perf_counter()

    t0 = time.perf_counter()
    await user_ai_rate_limiter.check(str(current_user.id))
    user_limiter_ms = int((time.perf_counter() - t0) * 1000)

    async with UnitOfWork() as uow:
        t1 = time.perf_counter()
        if payload.journal_id is not None:
            journal = await JournalRepository(uow.session).get_for_user(
                current_user.id, payload.journal_id
            )
            if journal is None:
                raise NotFoundException("Referenced journal entry was not found.")

        conversations = AssistantConversationRepository(uow.session)
        messages = AssistantMessageRepository(uow.session)

        conversation: AssistantConversation | None = None
        if payload.conversation_id is None:
            conversation = await conversations.add(
                AssistantConversation(
                    user_id=current_user.id,
                    title=payload.message[:80],
                    context={
                        "journal_id": (str(payload.journal_id) if payload.journal_id else None)
                    },
                )
            )
            await uow.session.flush()
        else:
            conversation = await conversations.get_for_user(
                current_user.id, payload.conversation_id
            )
            if conversation is None:
                raise NotFoundException("Assistant conversation was not found.")

        await messages.add(
            AssistantMessage(
                conversation_id=conversation.id,
                role=AssistantRole.USER,
                content=payload.message,
                message_metadata={
                    "journal_id": (str(payload.journal_id) if payload.journal_id else None)
                },
            )
        )
        db_setup_ms = int((time.perf_counter() - t1) * 1000)

        t2 = time.perf_counter()
        from app.rag.factory import get_rag_components
        from app.rag.types import RetrievalSource, SearchQuery

        rag = get_rag_components(uow.session)
        sources = [
            RetrievalSource.JOURNAL,
            RetrievalSource.REFLECTION,
            RetrievalSource.MOOD,
            RetrievalSource.CONVERSATION,
        ]
        query = SearchQuery(
            text=payload.message,
            user_id=current_user.id,
            sources=tuple(sources),
            metadata_filter={"conversation_id": str(conversation.id)},
            limit=5,
        )

        retrieved_docs = []
        if rag.retriever:
            retrieved_docs = await rag.retriever.retrieve(query)
        rag_ms = int((time.perf_counter() - t2) * 1000)

        memories: list = []
        context_window = None
        if rag.context_builder:
            context_window = await rag.context_builder.build(
                query,
                memories=memories,
                documents=retrieved_docs,
                token_budget=4000,
            )

        system_prompt = None
        user_prompt = payload.message
        if rag.prompt_builder and context_window:
            built_prompt = await rag.prompt_builder.build(context_window)
            system_prompt = built_prompt.system_prompt
            user_prompt = built_prompt.user_prompt

        t3 = time.perf_counter()
        provider = rag.ai_provider
        response = await provider.analyze_text(
            user_prompt,
            system_prompt=system_prompt,
        )
        ai_ms = int((time.perf_counter() - t3) * 1000)

        try:
            parsed_data = parse_json_object(response.content)
            content = str(
                parsed_data.get("reflection") or parsed_data.get("summary") or response.content
            )
        except Exception:
            content = response.content

        t4 = time.perf_counter()
        assistant_message = await messages.add(
            AssistantMessage(
                conversation_id=conversation.id,
                role=AssistantRole.ASSISTANT,
                content=content,
                message_metadata={
                    "provider": response.provider,
                    "model": response.model,
                    "latency_ms": response.latency_ms,
                    "request_id": response.request_id,
                    "cost_usd": (str(response.cost_usd) if response.cost_usd is not None else None),
                    "token_usage": {
                        "input_tokens": response.token_usage.input_tokens,
                        "output_tokens": response.token_usage.output_tokens,
                        "total_tokens": response.token_usage.total_tokens,
                    },
                    "retrieved_documents_count": len(retrieved_docs),
                    "rag_latency_ms": rag_ms,
                },
            )
        )
        await uow.commit()
        db_commit_ms = int((time.perf_counter() - t4) * 1000)

        total_ms = int((time.perf_counter() - t_start) * 1000)
        logger.info(
            "assistant_chat_completed",
            extra={
                "conversation_id": str(conversation.id),
                "message_id": str(assistant_message.id),
                "user_limiter_ms": user_limiter_ms,
                "db_setup_ms": db_setup_ms,
                "rag_ms": rag_ms,
                "ai_ms": ai_ms,
                "db_commit_ms": db_commit_ms,
                "total_ms": total_ms,
                "provider": response.provider,
                "model": response.model,
            },
        )

        import asyncio

        from app.rag.embeddings import generate_and_store_embedding
        from app.rag.types import RetrievalSource

        # Embed User Message
        asyncio.create_task(
            generate_and_store_embedding(
                text=payload.message,
                source=RetrievalSource.CONVERSATION,
                document_id=f"{conversation.id}_user_{int(time.time())}",
                user_id=current_user.id,
                metadata={"role": "user", "conversation_id": str(conversation.id)},
            )
        )
        # Embed Assistant Message
        asyncio.create_task(
            generate_and_store_embedding(
                text=content,
                source=RetrievalSource.CONVERSATION,
                document_id=f"{conversation.id}_assistant_{int(time.time())}",
                user_id=current_user.id,
                metadata={"role": "assistant", "conversation_id": str(conversation.id)},
            )
        )
        from decimal import Decimal

        from app.schemas.ai import AIProviderMetadata
        from app.schemas.enums import AIProvider as SchemaAIProvider

        enum_provider = None
        try:
            enum_provider = SchemaAIProvider(response.provider)
        except Exception:
            pass

        ai_meta = AIProviderMetadata(
            provider=enum_provider,
            provider_model=response.model,
            provider_latency_ms=response.latency_ms,
            provider_cost=(
                Decimal(str(response.cost_usd)) if response.cost_usd is not None else None
            ),
            provider_request_id=response.request_id,
        )

        return AssistantChatResponse(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            role=assistant_message.role,
            content=assistant_message.content,
            ai_metadata=ai_meta,
            created_at=assistant_message.created_at,
        )


@router.get(
    "/conversations",
    response_model=AssistantConversationListResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at", min_length=1, max_length=80),
    sort_direction: str = Query(default="desc", pattern="^(asc|desc)$"),
    status: ConversationStatus | None = None,
    include_deleted: bool = False,
) -> AssistantConversationListResponse:
    async with UnitOfWork() as uow:
        conversations = AssistantConversationRepository(uow.session)
        items = await conversations.list_for_user(
            current_user.id,
            pagination=PaginationParams(
                limit=limit,
                offset=offset,
                sort_by=sort_by,
                sort_direction=sort_direction,
            ),
            include_deleted=include_deleted,
            status=status,
        )
        total = await conversations.count_for_user(
            current_user.id,
            include_deleted=include_deleted,
            status=status,
        )
        return AssistantConversationListResponse(
            items=[
                AssistantConversationResponse(
                    id=c.id,
                    title=c.title,
                    status=c.status,
                    context=c.context or {},
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                )
                for c in items
            ],
            total=total,
        )


@router.get(
    "/conversations/{conversation_id}",
    response_model=AssistantConversationResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    include_deleted: bool = False,
) -> AssistantConversationResponse:
    async with UnitOfWork() as uow:
        conversations = AssistantConversationRepository(uow.session)
        conversation = await conversations.get_for_user(
            current_user.id,
            conversation_id,
            include_deleted=include_deleted,
        )
        if conversation is None:
            raise NotFoundException("Assistant conversation was not found.")
        return AssistantConversationResponse(
            id=conversation.id,
            title=conversation.title,
            status=conversation.status,
            context=conversation.context or {},
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=AssistantMessageListResponse,
    status_code=200,
    responses=ERROR_RESPONSES,
)
async def list_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at", min_length=1, max_length=80),
    sort_direction: str = Query(default="asc", pattern="^(asc|desc)$"),
    role: AssistantRole | None = None,
    include_deleted: bool = False,
) -> AssistantMessageListResponse:
    async with UnitOfWork() as uow:
        conversations = AssistantConversationRepository(uow.session)
        conversation = await conversations.get_for_user(
            current_user.id,
            conversation_id,
            include_deleted=include_deleted,
        )
        if conversation is None:
            raise NotFoundException("Assistant conversation was not found.")

        messages = AssistantMessageRepository(uow.session)
        items = await messages.list_for_conversation(
            conversation_id,
            pagination=PaginationParams(
                limit=limit,
                offset=offset,
                sort_by=sort_by,
                sort_direction=sort_direction,
            ),
            include_deleted=include_deleted,
            role=role,
        )
        total = await messages.count_for_conversation(
            conversation_id,
            include_deleted=include_deleted,
            role=role,
        )
        return AssistantMessageListResponse(
            items=[
                AssistantMessageResponse(
                    id=m.id,
                    conversation_id=m.conversation_id,
                    role=m.role,
                    content=m.content,
                    message_metadata=m.message_metadata or {},
                    created_at=m.created_at,
                    updated_at=m.updated_at,
                )
                for m in items
            ],
            total=total,
        )
