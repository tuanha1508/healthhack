from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.groq_service import GroqService
from app.models.chat_models import ChatRequest, ChatResponse, TranscriptItem

router = APIRouter()
groq_service = GroqService()

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Process chat messages with AI based on video transcript context
    """
    try:
        if not request.message or not request.transcript:
            raise HTTPException(
                status_code=400,
                detail="Message and transcript are required"
            )

        # Get AI response from Groq service
        response = await groq_service.generate_response(
            message=request.message,
            transcript=request.transcript,
            current_time=request.current_time,
            video_duration=request.video_duration
        )

        return ChatResponse(response=response)

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat request: {str(e)}"
        )