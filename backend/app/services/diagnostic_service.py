from typing import List, Optional
from app.models.diagnostic_models import Diagnostic
from app.models.chat_models import TranscriptItem

class DiagnosticService:
    def __init__(self):
        # Sample diagnostic data with real YouTube videos
        # These will fetch transcripts dynamically from YouTube
        self.diagnostics = self._initialize_diagnostics()

    async def get_diagnostic_history(self) -> List[Diagnostic]:
        """Get all diagnostics"""
        return self.diagnostics

    async def get_diagnostic_by_id(self, diagnostic_id: int) -> Optional[Diagnostic]:
        """Get a specific diagnostic by ID"""
        for diagnostic in self.diagnostics:
            if diagnostic.id == diagnostic_id:
                return diagnostic
        return None

    def _initialize_diagnostics(self) -> List[Diagnostic]:
        """Initialize diagnostic data with real YouTube videos about Alzheimer's and dementia care"""
        return [
            Diagnostic(
                id=1,
                date="November 8, 2024",
                time="10:30 AM",
                type="Understanding Alzheimer's Disease",
                status="completed",
                video_url="https://www.youtube.com/watch?v=xyQY8a-ng6g",  # TED-Ed: What is Alzheimer's disease?
                summary="Educational video explaining Alzheimer's disease, its symptoms, stages, and impact on the brain.",
                transcript=[]  # Will be fetched dynamically from YouTube
            ),
            Diagnostic(
                id=2,
                date="November 1, 2024",
                time="2:15 PM",
                type="Memory Care Activities",
                status="completed",
                video_url="https://www.youtube.com/watch?v=8nLl7dGPX0M",  # Activities for Alzheimer's Patients
                summary="Practical activities and exercises to help maintain cognitive function in Alzheimer's patients.",
                transcript=[]  # Will be fetched dynamically from YouTube
            ),
            Diagnostic(
                id=3,
                date="October 25, 2024",
                time="11:00 AM",
                type="Communication Strategies",
                status="completed",
                video_url="https://www.youtube.com/watch?v=OM0CMaafAjo",  # Communication tips for dementia
                summary="Effective communication techniques when caring for someone with dementia or Alzheimer's.",
                transcript=[]  # Will be fetched dynamically from YouTube
            ),
            Diagnostic(
                id=4,
                date="October 18, 2024",
                time="3:45 PM",
                type="10 Warning Signs of Alzheimer's",
                status="completed",
                video_url="https://www.youtube.com/watch?v=Pp_RKRNZJKQ",  # 10 Warning Signs
                summary="Learn about the 10 warning signs of Alzheimer's disease and when to seek medical help.",
                transcript=[]  # Will be fetched dynamically from YouTube
            ),
            Diagnostic(
                id=5,
                date="October 10, 2024",
                time="9:30 AM",
                type="Brain Exercises for Memory",
                status="completed",
                video_url="https://www.youtube.com/watch?v=UjAqBhSb9DE",  # Brain exercises
                summary="Simple brain exercises and activities to help improve memory and cognitive function.",
                transcript=[]  # Will be fetched dynamically from YouTube
            ),
            Diagnostic(
                id=6,
                date="October 3, 2024",
                time="1:00 PM",
                type="Caring for Someone with Dementia",
                status="completed",
                video_url="https://www.youtube.com/watch?v=HBRLMoL5YHY",  # Dementia care tips
                summary="Comprehensive guide for caregivers on how to provide effective care for dementia patients.",
                transcript=[]  # Will be fetched dynamically from YouTube
            )
        ]