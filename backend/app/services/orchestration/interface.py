from abc import ABC, abstractmethod

from app.services.orchestration.types import PipelineInput, PipelineResult


class AIPipelineOrchestrator(ABC):
    @abstractmethod
    async def run(self, payload: PipelineInput) -> PipelineResult:
        """Run the journal AI pipeline through independent stages."""
