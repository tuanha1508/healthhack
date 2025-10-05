from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
from typing import List, Optional, Dict, Any
from app.models.chat_models import TranscriptItem
import re

class YouTubeService:
    def __init__(self):
        pass

    def extract_video_id(self, url_or_id: str) -> str:
        """Extract YouTube video ID from URL or return ID if already provided"""
        # Check if it's already just an ID
        if re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
            return url_or_id

        # Try to extract from various YouTube URL formats
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})'
        ]

        for pattern in patterns:
            match = re.search(pattern, url_or_id)
            if match:
                return match.group(1)

        # If no pattern matches, assume it's an ID
        return url_or_id

    async def get_transcript(self, video_url: str, languages: List[str] = ['en']) -> List[TranscriptItem]:
        """
        Fetch transcript from YouTube video

        Args:
            video_url: YouTube video URL or ID
            languages: List of language codes to try (default: ['en'])

        Returns:
            List of TranscriptItem with timestamps and text
        """
        try:
            video_id = self.extract_video_id(video_url)
            print(f"Fetching transcript for video ID: {video_id}")

            # Try different methods to get transcript
            transcript_list = []

            try:
                # First try to get list of available transcripts
                transcript_api = YouTubeTranscriptApi.list_transcripts(video_id)

                # Try to find a transcript in preferred languages
                for lang in languages:
                    try:
                        transcript = transcript_api.find_transcript([lang])
                        transcript_list = transcript.fetch()
                        print(f"Found transcript in language: {lang}")
                        break
                    except:
                        continue

                # If no preferred language found, get any available transcript
                if not transcript_list:
                    for transcript in transcript_api:
                        print(f"Using available transcript: {transcript.language} (auto-generated: {transcript.is_generated})")
                        transcript_list = transcript.fetch()
                        break

            except Exception as e:
                print(f"Error listing transcripts: {str(e)}")
                # Fallback to direct fetch
                try:
                    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
                except:
                    pass

            if not transcript_list:
                print(f"No transcript found for video: {video_id}")
                return []

            # Convert to our TranscriptItem format
            transcript_items = []
            for entry in transcript_list:
                transcript_items.append(
                    TranscriptItem(
                        timestamp=entry['start'],  # Start time in seconds
                        text=entry['text'].replace('\n', ' ').strip()
                    )
                )

            print(f"Successfully fetched {len(transcript_items)} transcript items")
            return transcript_items

        except Exception as e:
            print(f"Error fetching YouTube transcript: {str(e)}")
            # Return empty transcript if error
            return []

    async def get_video_info(self, video_url: str) -> Dict[str, Any]:
        """
        Get video information from YouTube

        Args:
            video_url: YouTube video URL or ID

        Returns:
            Dictionary with video title, duration, and other metadata
        """
        try:
            video_id = self.extract_video_id(video_url)
            full_url = f"https://www.youtube.com/watch?v={video_id}"

            yt = YouTube(full_url)

            return {
                "video_id": video_id,
                "title": yt.title,
                "duration": yt.length,  # Duration in seconds
                "author": yt.author,
                "description": yt.description[:500] if yt.description else "",  # First 500 chars
                "thumbnail_url": yt.thumbnail_url,
                "embed_url": f"https://www.youtube.com/embed/{video_id}"
            }

        except Exception as e:
            print(f"Error fetching YouTube video info: {str(e)}")
            return {
                "video_id": self.extract_video_id(video_url),
                "title": "Unknown",
                "duration": 0,
                "embed_url": f"https://www.youtube.com/embed/{self.extract_video_id(video_url)}"
            }