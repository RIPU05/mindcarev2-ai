from fastapi import APIRouter, Depends

from app.ai import get_ai_provider
from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.exceptions import NotFoundException
from app.models.assistant import AssistantConversation, AssistantMessage
from app.models.users import User
from app.repositories.assistant import AssistantConversationRepository, AssistantMessageRepository
from app.repositories.journal import JournalRepository
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.schemas.common import ErrorResponse
from app.schemas.enums import AssistantRole
from app.services.ai_json import parse_json_object

router = APIRouter(prefix="/assistant", tags=["assistant"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES = {
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
    async with UnitOfWork() as uow:
        if payload.journal_id is not None:
            journal = await JournalRepository(uow.session).get_for_user(current_user.id, payload.journal_id)
            if journal is None:
                raise NotFoundException("Referenced journal entry was not found.")

        conversations = AssistantConversationRepository(uow.session)
        messages = AssistantMessageRepository(uow.session)

        if payload.conversation_id is None:
            conversation = await conversations.add(
                AssistantConversation(
                    user_id=current_user.id,
                    title=payload.message[:80],
                    context={"journal_id": str(payload.journal_id) if payload.journal_id else None},
                )
            )
            await uow.session.flush()
        else:
            conversation = await conversations.get_for_user(current_user.id, payload.conversation_id)
            if conversation is None:
                raise NotFoundException("Assistant conversation was not found.")

        await messages.add(
            AssistantMessage(
                conversation_id=conversation.id,
                role=AssistantRole.USER,
                content=payload.message,
                message_metadata={"journal_id": str(payload.journal_id) if payload.journal_id else None},
            )
        )
        import time
        from app.rag.factory import get_rag_components
        from app.rag.types import SearchQuery, RetrievalSource

        start_time = time.perf_counter()

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

        memories = []
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

        provider = rag.ai_provider
        response = await provider.analyze_text(
            user_prompt,
            system_prompt=system_prompt,
        )

        try:
            parsed_data = parse_json_object(response.content)
            content = str(parsed_data.get("reflection") or parsed_data.get("summary") or response.content)
        except Exception:
            content = response.content

        latency_ms = int((time.perf_counter() - start_time) * 1000)

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
                    "cost_usd": str(response.cost_usd) if response.cost_usd is not None else None,
                    "token_usage": {
                        "input_tokens": response.token_usage.input_tokens,
                        "output_tokens": response.token_usage.output_tokens,
                        "total_tokens": response.token_usage.total_tokens,
                    },
                    "retrieved_documents_count": len(retrieved_docs),
                    "rag_latency_ms": latency_ms,
                },
            )
        )
        await uow.commit()

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
        return AssistantChatResponse(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            role=assistant_message.role,
            content=assistant_message.content,
            ai_metadata={
                "provider": response.provider,
                "provider_model": response.model,
                "provider_latency_ms": response.latency_ms,
                "provider_cost": str(response.cost_usd) if response.cost_usd is not None else None,
                "provider_request_id": response.request_id,
            },
            created_at=assistant_message.created_at,
        )
