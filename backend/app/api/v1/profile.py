from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.db.uow import UnitOfWork
from app.models.users import Profile, User
from app.repositories.users import ProfileRepository
from app.schemas.common import ErrorResponse
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/profile", tags=["profile"], dependencies=[Depends(get_current_user)])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.get("", response_model=ProfileResponse, status_code=200, responses=ERROR_RESPONSES)
async def get_profile(current_user: User = Depends(get_current_user)) -> ProfileResponse:
    async with UnitOfWork() as uow:
        profile = await ensure_profile(current_user, ProfileRepository(uow.session))
        await uow.commit()
        return profile_response(current_user, profile)


@router.patch("", response_model=ProfileResponse, status_code=200, responses=ERROR_RESPONSES)
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    async with UnitOfWork() as uow:
        repository = ProfileRepository(uow.session)
        profile = await ensure_profile(current_user, repository)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        await repository.update(profile)
        await uow.commit()
        return profile_response(current_user, profile)


async def ensure_profile(user: User, repository: ProfileRepository) -> Profile:
    profile = await repository.get_by_user_id(user.id)
    if profile is None:
        profile = await repository.add(Profile(user_id=user.id))
    return profile


def profile_response(user: User, profile: Profile) -> ProfileResponse:
    return ProfileResponse(
        id=profile.id,
        email=user.email,
        display_name=profile.display_name or "MindCare User",
        timezone=profile.timezone or "UTC",
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
