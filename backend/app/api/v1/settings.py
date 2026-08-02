from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.exceptions import NotFoundException
from app.models.users import User, UserSettings
from app.repositories.users import UserSettingsRepository
from app.schemas.common import ErrorResponse
from app.schemas.settings import UserSettingsResponse, UserSettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["profile"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES: dict[int | str, dict] = {
    401: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.get("", response_model=UserSettingsResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_settings(current_user: User = Depends(get_current_user)) -> UserSettingsResponse:
    async with UnitOfWork() as uow:
        settings = await ensure_settings(current_user, UserSettingsRepository(uow.session))
        await uow.commit()
        return settings_response(settings)


@router.patch("", response_model=UserSettingsResponse, status_code=200, responses=ERROR_RESPONSES)
async def update_settings(
    payload: UserSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> UserSettingsResponse:
    async with UnitOfWork() as uow:
        repository = UserSettingsRepository(uow.session)
        settings = await ensure_settings(current_user, repository)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(settings, field, value)
        await repository.update(settings)
        await uow.commit()
        return settings_response(settings)


@router.delete("", status_code=204, responses=ERROR_RESPONSES)
async def delete_settings(current_user: User = Depends(get_current_user)) -> None:
    async with UnitOfWork() as uow:
        repository = UserSettingsRepository(uow.session)
        settings = await repository.get_by_user_id(current_user.id, include_deleted=True)
        if settings is None:
            raise NotFoundException("User settings were not found.")
        await repository.delete(settings)
        await uow.commit()
    return None


@router.post(
    "/restore", response_model=UserSettingsResponse, status_code=200, responses=ERROR_RESPONSES
)
async def restore_settings(current_user: User = Depends(get_current_user)) -> UserSettingsResponse:
    async with UnitOfWork() as uow:
        repository = UserSettingsRepository(uow.session)
        settings = await repository.get_by_user_id(current_user.id)
        if settings is None:
            settings = await repository.add(UserSettings(user_id=current_user.id))
        await repository.restore(settings)
        await uow.commit()
        return settings_response(settings)


async def ensure_settings(user: User, repository: UserSettingsRepository) -> UserSettings:
    settings = await repository.get_by_user_id(user.id)
    if settings is None:
        settings = await repository.add(UserSettings(user_id=user.id))
    return settings


def settings_response(settings: UserSettings) -> UserSettingsResponse:
    return UserSettingsResponse(
        id=settings.id,
        notifications_enabled=settings.notifications_enabled,
        privacy_preferences=settings.privacy_preferences or {},
        accessibility_preferences=settings.accessibility_preferences or {},
        created_at=settings.created_at,
        updated_at=settings.updated_at,
    )
