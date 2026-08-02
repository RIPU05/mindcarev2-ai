from uuid import UUID

from sqlalchemy import Select
from sqlalchemy.exc import SQLAlchemyError

from app.db.errors import translate_database_error
from app.models.assistant import AssistantConversation, AssistantMessage
from app.repositories.base import Repository
from app.schemas.enums import AssistantRole, ConversationStatus
from app.utils.pagination import PaginationParams


class AssistantConversationRepository(Repository[AssistantConversation]):
    model = AssistantConversation

    def scoped_select(
        self,
        user_id: UUID,
        *,
        include_deleted: bool = False,
        status: ConversationStatus | None = None,
    ) -> Select[tuple[AssistantConversation]]:
        statement = self._base_select(include_deleted=include_deleted).where(
            AssistantConversation.user_id == user_id
        )
        if status is not None:
            statement = statement.where(AssistantConversation.status == status)
        return statement

    async def get_for_user(
        self,
        user_id: UUID,
        conversation_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> AssistantConversation | None:
        statement = (
            self.scoped_select(user_id, include_deleted=include_deleted)
            .where(AssistantConversation.id == conversation_id)
            .limit(1)
        )
        try:
            return (await self.session.scalars(statement)).first()
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        pagination: PaginationParams,
        include_deleted: bool = False,
        status: ConversationStatus | None = None,
    ) -> list[AssistantConversation]:
        statement = self._apply_pagination(
            self.scoped_select(user_id, include_deleted=include_deleted, status=status),
            pagination,
        )
        try:
            return list(await self.session.scalars(statement))
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc


class AssistantMessageRepository(Repository[AssistantMessage]):
    model = AssistantMessage

    async def list_for_conversation(
        self,
        conversation_id: UUID,
        *,
        pagination: PaginationParams,
        include_deleted: bool = False,
        role: AssistantRole | None = None,
    ) -> list[AssistantMessage]:
        statement = self._base_select(include_deleted=include_deleted).where(
            AssistantMessage.conversation_id == conversation_id
        )
        if role is not None:
            statement = statement.where(AssistantMessage.role == role)
        statement = self._apply_pagination(statement, pagination)
        try:
            return list(await self.session.scalars(statement))
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc


AssistantRepository = AssistantConversationRepository
