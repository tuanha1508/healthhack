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
            # Filter transcript to only include content up to current pause time
            relevant_transcript = [
                item for item in transcript
                if item.timestamp <= current_time
            ]

            # Create context from relevant transcript
            context = "\n".join([
                f"[{self._format_time(item.timestamp)}] {item.text}"
                for item in relevant_transcript
            ])

            # Create the system prompt
            system_prompt = f"""You are a helpful medical assistant helping a patient understand medical instructions from their doctor.
The patient is watching a video with medical instructions and has paused at {self._format_time(current_time)} out of {self._format_time(video_duration)} total.

Here is the transcript of what the patient has watched so far:
{context}

Please answer the patient's question based only on the content they have watched up to this point.
Be clear, concise, and use simple language that a patient can easily understand.
If the question is about something that hasn't been covered yet in the video, kindly let them know they should continue watching."""

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
        minutes = int(seconds // 60)
        remaining_seconds = int(seconds % 60)
        return f"{minutes:02d}:{remaining_seconds:02d}"