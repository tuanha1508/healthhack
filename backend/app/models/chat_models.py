from pydantic import BaseModel
from typing import List, Optional

class TranscriptItem(BaseModel):
    timestamp: Optional[float] = 0.0  # in seconds, default to 0 if not provided
    text: str

class ChatRequest(BaseModel):
    message: str
    transcript: List[TranscriptItem]
    current_time: float
    video_duration: Optional[float] = 120.0

class ChatResponse(BaseModel):
    response: str

class Message(BaseModel):
    id: int
    text: str
    sender: str  # 'user' or 'bot'
    timestamp: str