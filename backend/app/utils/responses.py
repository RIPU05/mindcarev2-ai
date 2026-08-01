from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class ApiResponse(BaseModel, Generic[DataT]):
    data: DataT
    request_id: str | None = None


class ApiErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    details: dict | None = None
