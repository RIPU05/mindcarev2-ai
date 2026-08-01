from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    cursor: str | None = None
    sort_by: str = Field(default="created_at", min_length=1, max_length=80)
    sort_direction: str = Field(default="desc", pattern="^(asc|desc)$")


class PageInfo(BaseModel):
    limit: int
    offset: int
    total: int | None = None
    has_more: bool = False
    next_cursor: str | None = None
