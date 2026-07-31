from fastapi import APIRouter

from app.schemas.analysis import (
    AudioAnalysisRequest,
    MoodAnalysisResponse,
    TextAnalysisRequest,
)
from app.schemas.common import ErrorResponse

router = APIRouter(prefix="/analysis", tags=["analysis"])

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    401: {"model": ErrorResponse},
    413: {"model": ErrorResponse},
    415: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


@router.post("/text", response_model=MoodAnalysisResponse, status_code=200, responses=ERROR_RESPONSES)
async def analyze_text(payload: TextAnalysisRequest) -> MoodAnalysisResponse:
    return MoodAnalysisResponse.mock(input_type="text")


@router.post("/audio", response_model=MoodAnalysisResponse, status_code=202, responses=ERROR_RESPONSES)
async def analyze_audio(payload: AudioAnalysisRequest) -> MoodAnalysisResponse:
    return MoodAnalysisResponse.mock(input_type="audio")
