from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
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

# JSON file for persisting video metadata
METADATA_FILE = VIDEOS_DIR / "video_metadata.json"

# Load existing video metadata or initialize empty storage
def load_video_storage():
    """Load video metadata from JSON file"""
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading video metadata: {e}")
            return []
    return []

def save_video_storage():
    """Save video metadata to JSON file"""
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(video_storage, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving video metadata: {e}")

# Initialize video storage from file
video_storage = load_video_storage()

def cleanup_orphaned_files():
    """Clean up orphaned video files and metadata entries"""
    # Remove metadata entries for missing video files
    global video_storage
    cleaned_storage = []
    for video in video_storage:
        video_path = VIDEOS_DIR / video.get("filename", "")
        if video_path.exists():
            cleaned_storage.append(video)
        else:
            print(f"Removing metadata for missing video file: {video.get('filename')}")

    if len(cleaned_storage) != len(video_storage):
        video_storage = cleaned_storage
        save_video_storage()

    # Note: We don't delete video files without metadata to avoid accidental data loss
    # Those files can be manually cleaned up if needed

# Clean up on startup
cleanup_orphaned_files()

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

        # Store in memory and persist to file
        video_storage.append(video_data)
        save_video_storage()

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
            "watched": video.get("watched", False),
            "watched_at": video.get("watched_at", None),
            "video_url": f"/api/videos/stream/{video['id']}",
            "summary": video["description"],
            "transcript": video["subtitles"]
        })

    return JSONResponse(content={
        "videos": patient_videos
    })

@router.get("/stream/{video_id}")
async def stream_video(video_id: str, request: Request):
    """
    Stream a video file with range request support
    """
    # Find video in storage
    video_data = next((v for v in video_storage if v["id"] == video_id), None)

    if not video_data:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = VIDEOS_DIR / video_data["filename"]

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    # Get file size
    file_size = video_path.stat().st_size

    # Check if range request
    range_header = request.headers.get('range')

    if range_header:
        # Parse range header
        try:
            range_start = int(range_header.split('=')[1].split('-')[0])
            range_end = file_size - 1
            if '-' in range_header.split('=')[1] and range_header.split('=')[1].split('-')[1]:
                range_end = int(range_header.split('=')[1].split('-')[1])
        except (ValueError, IndexError):
            range_start = 0
            range_end = file_size - 1

        # Open file and read the requested range
        def iterfile():
            with open(video_path, 'rb') as file:
                file.seek(range_start)
                chunk_size = 8192
                current_position = range_start
                while current_position <= range_end:
                    remaining = range_end - current_position + 1
                    read_size = min(chunk_size, remaining)
                    data = file.read(read_size)
                    if not data:
                        break
                    current_position += len(data)
                    yield data

        # Determine content type based on file extension
        file_ext = video_data["filename"].split('.')[-1].lower()
        content_type = {
            'webm': 'video/webm',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo'
        }.get(file_ext, 'video/webm')

        return StreamingResponse(
            iterfile(),
            status_code=206,
            media_type=content_type,
            headers={
                'Content-Range': f'bytes {range_start}-{range_end}/{file_size}',
                'Accept-Ranges': 'bytes',
                'Content-Length': str(range_end - range_start + 1),
                'Content-Disposition': f'inline; filename={video_data["filename"]}',
                'Cache-Control': 'no-cache'
            }
        )
    else:
        # Regular file response for non-range requests
        file_ext = video_data["filename"].split('.')[-1].lower()
        content_type = {
            'webm': 'video/webm',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo'
        }.get(file_ext, 'video/webm')

        return FileResponse(
            path=video_path,
            media_type=content_type,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename={video_data['filename']}",
                "Cache-Control": "no-cache",
                "Content-Length": str(file_size)
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

@router.post("/reload")
async def reload_video_metadata():
    """
    Reload video metadata from file
    """
    global video_storage
    try:
        video_storage = load_video_storage()
        cleanup_orphaned_files()
        return JSONResponse(content={
            "success": True,
            "message": f"Reloaded metadata for {len(video_storage)} videos"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

    # Save changes to file
    save_video_storage()

    return JSONResponse(content={
        "success": True,
        "message": f"Video status updated to {status}"
    })

@router.post("/{video_id}/watched")
async def mark_video_watched(video_id: str):
    """
    Mark a video as watched
    """
    video_data = next((v for v in video_storage if v["id"] == video_id), None)

    if not video_data:
        raise HTTPException(status_code=404, detail="Video not found")

    video_data["watched"] = True
    video_data["watched_at"] = datetime.now().isoformat()
    video_data["status"] = "watched"

    # Save changes to file
    save_video_storage()

    return JSONResponse(content={
        "success": True,
        "message": "Video marked as watched",
        "watched_at": video_data["watched_at"]
    })

@router.post("/{video_id}/unwatch")
async def mark_video_unwatched(video_id: str):
    """
    Mark a video as unwatched
    """
    video_data = next((v for v in video_storage if v["id"] == video_id), None)

    if not video_data:
        raise HTTPException(status_code=404, detail="Video not found")

    video_data["watched"] = False
    video_data.pop("watched_at", None)
    video_data["status"] = "unwatched"

    # Save changes to file
    save_video_storage()

    return JSONResponse(content={
        "success": True,
        "message": "Video marked as unwatched"
    })