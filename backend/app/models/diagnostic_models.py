from pydantic import BaseModel
from typing import List, Optional
from app.models.chat_models import TranscriptItem

class Diagnostic(BaseModel):
    id: int
    date: str
    time: str
    type: str
    status: str  # 'completed', 'pending', 'in-progress'
    video_url: Optional[str] = None
    summary: str
    transcript: Optional[List[TranscriptItem]] = None

class DiagnosticHistory(BaseModel):
    diagnostics: List[Diagnostic]