from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.exc import SQLAlchemyError

from app.db.errors import translate_database_error
from app.models.analysis import MoodAnalysis, MoodStreak
from app.repositories.base import Repository
from app.schemas.enums import AnalysisInputType, AnalysisStatus, RiskLevel
from app.utils.pagination import PaginationParams


class MoodAnalysisRepository(Repository[MoodAnalysis]):
    model = MoodAnalysis

    def scoped_select(
        self,
        user_id: UUID,
        *,
        include_deleted: bool = False,
        input_type: AnalysisInputType | None = None,
        status: AnalysisStatus | None = None,
        risk_level: RiskLevel | None = None,
    ) -> Select[tuple[MoodAnalysis]]:
        statement = self._base_select(include_deleted=include_deleted).where(
            MoodAnalysis.user_id == user_id
        )
        if input_type is not None:
            statement = statement.where(MoodAnalysis.input_type == input_type)
        if status is not None:
            statement = statement.where(MoodAnalysis.status == status)
        if risk_level is not None:
            statement = statement.where(MoodAnalysis.risk_level == risk_level)
        return statement

    async def get_for_user(
        self,
        user_id: UUID,
        analysis_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> MoodAnalysis | None:
        statement = (
            self.scoped_select(user_id, include_deleted=include_deleted)
            .where(MoodAnalysis.id == analysis_id)
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
        input_type: AnalysisInputType | None = None,
        status: AnalysisStatus | None = None,
        risk_level: RiskLevel | None = None,
    ) -> list[MoodAnalysis]:
        statement = self._apply_pagination(
            self.scoped_select(
                user_id,
                include_deleted=include_deleted,
                input_type=input_type,
                status=status,
                risk_level=risk_level,
            ),
            pagination,
        )
        try:
            return list(await self.session.scalars(statement))
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc

    async def count_for_user(
        self,
        user_id: UUID,
        *,
        include_deleted: bool = False,
        input_type: AnalysisInputType | None = None,
        status: AnalysisStatus | None = None,
        risk_level: RiskLevel | None = None,
    ) -> int:
        statement = select(func.count()).select_from(
            self.scoped_select(
                user_id,
                include_deleted=include_deleted,
                input_type=input_type,
                status=status,
                risk_level=risk_level,
            ).subquery()
        )
        try:
            return int(await self.session.scalar(statement) or 0)
        except SQLAlchemyError as exc:
            raise translate_database_error(exc) from exc


class MoodStreakRepository(Repository[MoodStreak]):
    model = MoodStreak


AnalysisRepository = MoodAnalysisRepository
