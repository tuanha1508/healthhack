from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
from typing import List, Dict
import logging
from app.core.config import settings

# Import Groq and check version
try:
    import groq
    from groq import Groq
    groq_version = groq.__version__ if hasattr(groq, '__version__') else 'Unknown'
except ImportError as e:
    groq = None
    Groq = None
    groq_version = 'Not installed'

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log Groq version
logger.info(f"Groq SDK version: {groq_version}")

# Initialize Groq client using settings
groq_api_key = settings.GROQ_API_KEY
if not groq_api_key:
    logger.warning("GROQ_API_KEY not found in settings")
else:
    logger.info("Groq API key configured successfully")

def get_groq_client():
    """Get or create Groq client with current SDK."""
    if groq_api_key and Groq:
        client = Groq(api_key=groq_api_key)
        # Check if audio attribute exists
        if hasattr(client, 'audio'):
            logger.info("✅ Groq client has audio attribute")
            return client
        else:
            logger.warning(f"❌ Groq client missing audio attribute. Version: {groq_version}")
            logger.warning(f"Available attributes: {[attr for attr in dir(client) if not attr.startswith('_')]}")
            return None
    return None

client = get_groq_client()

def parse_transcription_to_segments(text: str, total_duration: float = None) -> List[Dict]:
    """
    Parse transcription text into segments with timestamps.
    This is a simple implementation that splits by sentences.
    """
    import re

    # Split text into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())

    if not sentences:
        return []

    # If no duration provided, estimate based on text length (rough estimate: 150 words per minute)
    if total_duration is None:
        word_count = len(text.split())
        total_duration = (word_count / 150) * 60  # Convert to seconds

    # Calculate time per sentence
    time_per_sentence = total_duration / len(sentences) if sentences else 0

    segments = []
    current_time = 0.0

    for sentence in sentences:
        if sentence.strip():
            end_time = current_time + time_per_sentence
            segments.append({
                "start": round(current_time, 2),
                "end": round(end_time, 2),
                "text": sentence.strip()
            })
            current_time = end_time

    return segments

@router.post("/")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using Groq's Whisper models.
    Returns timestamped segments of transcribed text.
    """
    try:
        # Get fresh client instance to ensure we have the latest SDK
        groq_client = get_groq_client()

        # Check if Groq client is initialized
        if not groq_client:
            logger.warning("Groq client not initialized, using mock data")
            return JSONResponse(content={
                "transcription": [
                    {"start": 0.0, "end": 3.0, "text": "Hello, this is your doctor speaking."},
                    {"start": 3.0, "end": 6.0, "text": "Today we'll practice a memory exercise."},
                    {"start": 6.0, "end": 9.0, "text": "Please follow along carefully."}
                ],
                "warning": "Groq API key not configured. Using mock data."
            })

        # Read file content first
        logger.info(f"Received file: {audio.filename}, type: {audio.content_type}")
        content = await audio.read()

        if len(content) == 0:
            logger.warning("Received empty audio file")
            return JSONResponse(content={
                "transcription": [
                    {"start": 0.0, "end": 3.0, "text": "Recording was empty. Please try again."}
                ],
                "warning": "Empty audio file received"
            })

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            # Get file size for logging
            file_size = os.path.getsize(tmp_file_path)
            logger.info(f"Audio file size: {file_size} bytes")

            # Transcribe using Groq Whisper
            logger.info("Starting transcription with Groq Whisper...")

            # Use the EXACT format from Groq documentation
            with open(tmp_file_path, "rb") as file:
                transcription = groq_client.audio.transcriptions.create(
                    file=(audio.filename or "recording.webm", file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json"
                )
                logger.info("Transcription completed successfully")

            # Process the transcription response
            segments = []

            # Handle different response formats
            if hasattr(transcription, 'segments') and transcription.segments:
                logger.info(f"Got {len(transcription.segments)} segments from Groq")
                for segment in transcription.segments:
                    segments.append({
                        "start": float(segment.start) if hasattr(segment, 'start') else segment.get('start', 0),
                        "end": float(segment.end) if hasattr(segment, 'end') else segment.get('end', 0),
                        "text": str(segment.text) if hasattr(segment, 'text') else segment.get('text', '').strip()
                    })
            elif hasattr(transcription, 'text') and transcription.text:
                # If we only got text without timestamps, create segments
                logger.info("Got text without segments, creating segments...")
                segments = parse_transcription_to_segments(transcription.text)
            elif isinstance(transcription, dict):
                # Handle dictionary response
                if 'segments' in transcription:
                    for segment in transcription['segments']:
                        segments.append({
                            "start": float(segment.get('start', 0)),
                            "end": float(segment.get('end', 0)),
                            "text": segment.get('text', '').strip()
                        })
                elif 'text' in transcription:
                    segments = parse_transcription_to_segments(transcription['text'])

            if segments:
                logger.info(f"Successfully transcribed with {len(segments)} segments")
                return JSONResponse(content={
                    "transcription": segments,
                    "status": "success",
                    "model": "whisper-large-v3"
                })
            else:
                # Return the raw text if no segments
                text = transcription.text if hasattr(transcription, 'text') else str(transcription)
                logger.info(f"No segments, returning text: {text[:100]}...")
                segments = parse_transcription_to_segments(text) if text else []

                return JSONResponse(content={
                    "transcription": segments if segments else [{"start": 0, "end": 5, "text": text or "Transcription completed."}],
                    "status": "success",
                    "model": "whisper-large-v3"
                })

        finally:
            # Clean up temp file
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)
                logger.info("Cleaned up temporary file")

    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")

        # Return enhanced mock data as fallback
        mock_transcription = [
            {"start": 0.0, "end": 3.0, "text": "Hello, this is Dr. Smith speaking."},
            {"start": 3.0, "end": 6.5, "text": "Today we'll practice a memory exercise together."},
            {"start": 6.5, "end": 10.0, "text": "Please watch carefully and follow along."},
            {"start": 10.0, "end": 13.0, "text": "First, look at these three objects."},
            {"start": 13.0, "end": 16.0, "text": "Try to remember them in order."},
            {"start": 16.0, "end": 19.0, "text": "We'll review them at the end."},
            {"start": 19.0, "end": 22.0, "text": "Take your time and don't feel rushed."}
        ]

        return JSONResponse(
            status_code=200,
            content={
                "transcription": mock_transcription,
                "warning": f"Using fallback transcription. Error: {str(e)}",
                "status": "fallback"
            }
        )

@router.post("/turbo")
async def transcribe_audio_turbo(audio: UploadFile = File(...)):
    """
    Transcribe audio using Groq's Whisper Large v3 Turbo model (faster).
    """
    try:
        groq_client = get_groq_client()
        if not groq_client:
            return JSONResponse(content={
                "transcription": [],
                "warning": "Groq API key not configured."
            })

        logger.info(f"Turbo transcription for: {audio.filename}")

        # Read content first
        content = await audio.read()

        if len(content) == 0:
            logger.warning("Received empty audio file for turbo")
            return JSONResponse(content={
                "transcription": [
                    {"start": 0.0, "end": 3.0, "text": "Recording was empty. Please try again."}
                ],
                "warning": "Empty audio file received"
            })

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            with open(tmp_file_path, "rb") as file:
                # Use Turbo model for faster processing
                transcription = groq_client.audio.transcriptions.create(
                    file=(audio.filename or "recording.webm", file.read()),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json"
                )

            # Process segments
            segments = []
            if hasattr(transcription, 'segments') and transcription.segments:
                for segment in transcription.segments:
                    segments.append({
                        "start": float(segment.start) if hasattr(segment, 'start') else segment.get('start', 0),
                        "end": float(segment.end) if hasattr(segment, 'end') else segment.get('end', 0),
                        "text": str(segment.text) if hasattr(segment, 'text') else segment.get('text', '').strip()
                    })
            elif hasattr(transcription, 'text'):
                segments = parse_transcription_to_segments(transcription.text)

            return JSONResponse(content={
                "transcription": segments,
                "status": "success",
                "model": "whisper-large-v3-turbo"
            })

        finally:
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)

    except Exception as e:
        logger.error(f"Turbo transcription error: {str(e)}")
        return JSONResponse(
            status_code=200,
            content={
                "transcription": [
                    {"start": 0.0, "end": 3.0, "text": "Turbo transcription encountered an issue."},
                    {"start": 3.0, "end": 6.0, "text": "Using fallback data."}
                ],
                "warning": str(e),
                "status": "error"
            }
        )

@router.get("/status")
async def transcription_status():
    """Check if transcription service is available."""
    has_audio = hasattr(client, 'audio') if client else False
    has_transcriptions = hasattr(client.audio, 'transcriptions') if client and has_audio else False

    return {
        "available": client is not None and has_audio and has_transcriptions,
        "api_key_configured": groq_api_key is not None,
        "has_audio_attribute": has_audio,
        "has_transcriptions": has_transcriptions,
        "models": ["whisper-large-v3", "whisper-large-v3-turbo"],
        "service": "Groq Whisper API"
    }

@router.get("/models")
async def available_models():
    """Get list of available Whisper models on Groq."""
    return {
        "models": [
            {
                "id": "whisper-large-v3",
                "name": "Whisper Large v3",
                "description": "Most accurate model for transcription",
                "speed": "standard"
            },
            {
                "id": "whisper-large-v3-turbo",
                "name": "Whisper Large v3 Turbo",
                "description": "Faster transcription with good accuracy",
                "speed": "fast"
            }
        ],
        "recommended": "whisper-large-v3-turbo"
    }