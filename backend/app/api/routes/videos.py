from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Optional
import os
import json
import shutil
from datetime import datetime
import uuid
from pathlib import Path

router = APIRouter()

# Create videos directory if it doesn't exist
VIDEOS_DIR = Path("uploaded_videos")
VIDEOS_DIR.mkdir(exist_ok=True)

# In-memory storage for video metadata (will be replaced with database later)
video_storage = []

@router.post("/upload")
async def upload_video(
    video: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    subtitles: str = Form("[]")  # JSON string of subtitles
):
    """
    Upload a video from doctor to patient with subtitles
    """
    try:
        # Generate unique video ID
        video_id = str(uuid.uuid4())

        # Create video filename
        file_extension = video.filename.split('.')[-1] if '.' in video.filename else 'webm'
        video_filename = f"{video_id}.{file_extension}"
        video_path = VIDEOS_DIR / video_filename

        # Save video file
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        # Parse subtitles
        try:
            subtitles_data = json.loads(subtitles)
        except json.JSONDecodeError:
            subtitles_data = []

        # Create video metadata
        video_data = {
            "id": video_id,
            "title": title,
            "description": description,
            "filename": video_filename,
            "subtitles": subtitles_data,
            "uploaded_at": datetime.now().isoformat(),
            "status": "unwatched",
            "type": "Doctor Instruction"
        }

        # Store in memory (replace with database later)
        video_storage.append(video_data)

        return JSONResponse(content={
            "success": True,
            "video_id": video_id,
            "message": "Video uploaded successfully"
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_videos():
    """
    Get list of all videos for the patient
    """
    # Transform for patient view
    patient_videos = []
    for video in video_storage:
        patient_videos.append({
            "id": video["id"],
            "date": datetime.fromisoformat(video["uploaded_at"]).strftime("%B %d, %Y"),
            "time": datetime.fromisoformat(video["uploaded_at"]).strftime("%I:%M %p"),
            "type": f"{video['type']}: {video['title']}",
            "status": video["status"],
            "video_url": f"/api/videos/stream/{video['id']}",
            "summary": video["description"],
            "transcript": video["subtitles"]
        })

    return JSONResponse(content={
        "videos": patient_videos
    })

@router.get("/stream/{video_id}")
async def stream_video(video_id: str):
    """
    Stream a video file
    """
    # Find video in storage
    video_data = next((v for v in video_storage if v["id"] == video_id), None)

    if not video_data:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = VIDEOS_DIR / video_data["filename"]

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        path=video_path,
        media_type="video/webm",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Disposition": f"inline; filename={video_data['filename']}"
        }
    )

@router.get("/{video_id}")
async def get_video_details(video_id: str):
    """
    Get detailed information about a specific video
    """
    video_data = next((v for v in video_storage if v["id"] == video_id), None)

    if not video_data:
        raise HTTPException(status_code=404, detail="Video not found")

    return JSONResponse(content=video_data)

@router.put("/{video_id}/status")
async def update_video_status(video_id: str, status: str):
    """
    Update video watch status
    """
    video_data = next((v for v in video_storage if v["id"] == video_id), None)

    if not video_data:
        raise HTTPException(status_code=404, detail="Video not found")

    video_data["status"] = status

    if status == "watched":
        video_data["completed_at"] = datetime.now().isoformat()

    return JSONResponse(content={
        "success": True,
        "message": f"Video status updated to {status}"
    })