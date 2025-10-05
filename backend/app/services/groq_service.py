from groq import Groq
from typing import List
from app.core.config import settings
from app.models.chat_models import TranscriptItem

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

    async def generate_response(
        self,
        message: str,
        transcript: List[TranscriptItem],
        current_time: float,
        video_duration: float
    ) -> str:
        """
        Generate AI response based on video transcript context
        """
        try:
            # Ensure current_time is valid
            if current_time is None:
                current_time = 0.0

            # Ensure video_duration is valid
            if video_duration is None or video_duration == 0:
                video_duration = 120.0  # Default to 2 minutes if not provided

            # Separate transcript into watched and unwatched portions
            watched_transcript = [
                item for item in transcript
                if item.timestamp is not None and item.timestamp <= current_time
            ]

            unwatched_transcript = [
                item for item in transcript
                if item.timestamp is not None and item.timestamp > current_time
            ]

            # Create context from watched transcript
            watched_context = "\n".join([
                f"[{self._format_time(item.timestamp)}] {item.text}"
                for item in watched_transcript
            ])

            # Create context from full transcript for searching
            full_context = "\n".join([
                f"[{self._format_time(item.timestamp)}] {item.text}"
                for item in transcript
            ])

            # Check if there's content coming later
            unwatched_context = "\n".join([
                f"[{self._format_time(item.timestamp)}] {item.text}"
                for item in unwatched_transcript
            ]) if unwatched_transcript else ""

            # Create the enhanced system prompt
            system_prompt = f"""You are a helpful medical assistant helping a patient understand medical instructions from their doctor.
The patient is watching a video with medical instructions and has paused at {self._format_time(current_time)} out of {self._format_time(video_duration)} total.

IMPORTANT INSTRUCTIONS:
1. First, check if the answer to the patient's question is available anywhere in the FULL transcript (both watched and unwatched portions).
2. If the answer IS in the transcript:
   - If it's in the portion they've already watched: Provide a clear, detailed answer based on what was said.
   - If it's in a later portion they haven't watched yet: Say something like "The doctor will address this at around [TIME] in the video, but I can tell you that..." and then provide the answer.
3. If the answer is NOT in the transcript: Provide general helpful medical information if appropriate, but clarify that this specific topic wasn't covered in the video.
4. Always be helpful and provide actual answers - don't just tell them to keep watching without giving information.
5. Use simple, patient-friendly language.

WATCHED PORTION (up to {self._format_time(current_time)}):
{watched_context if watched_context else "No content watched yet"}

UPCOMING PORTION (after {self._format_time(current_time)}):
{unwatched_context if unwatched_context else "No remaining content"}

FULL TRANSCRIPT (for reference):
{full_context}

Remember: Always provide helpful answers even if the content will be covered later. The patient needs information now."""

            # Call Groq API
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model=self.model,
                temperature=0.7,
                max_tokens=500,
            )

            response = completion.choices[0].message.content
            return response if response else "I apologize, but I couldn't generate a response. Please try again."

        except Exception as e:
            print(f"Error generating Groq response: {str(e)}")
            raise

    def _format_time(self, seconds: float) -> str:
        """Format time in MM:SS format"""
        if seconds is None:
            return "00:00"
        minutes = int(seconds // 60)
        remaining_seconds = int(seconds % 60)
        return f"{minutes:02d}:{remaining_seconds:02d}"