from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.youtube_service import YouTubeService
from app.models.chat_models import TranscriptItem

router = APIRouter()
youtube_service = YouTubeService()

class YouTubeTranscriptRequest(BaseModel):
    video_url: str
    languages: Optional[List[str]] = ['en']

class YouTubeTranscriptResponse(BaseModel):
    video_id: str
    title: str
    duration: int
    embed_url: str
    transcript: List[TranscriptItem]

@router.post("/transcript", response_model=YouTubeTranscriptResponse)
async def get_youtube_transcript(request: YouTubeTranscriptRequest):
    """
    Fetch transcript from a YouTube video
    """
    try:
        # Get video info
        video_info = await youtube_service.get_video_info(request.video_url)

        # Get transcript
        transcript = await youtube_service.get_transcript(
            request.video_url,
            request.languages
        )

        if not transcript:
            raise HTTPException(
                status_code=404,
                detail="No transcript available for this video. The video might not have captions."
            )

        return YouTubeTranscriptResponse(
            video_id=video_info["video_id"],
            title=video_info.get("title", "Unknown"),
            duration=video_info.get("duration", 0),
            embed_url=video_info["embed_url"],
            transcript=transcript
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in YouTube transcript endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch YouTube transcript: {str(e)}"
        )