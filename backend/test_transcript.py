from youtube_transcript_api import YouTubeTranscriptApi

def test_transcript(video_id):
    print(f"\nTesting video: {video_id}")
    print("-" * 50)

    try:
        # List all available transcripts
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        print("Available transcripts:")
        for transcript in transcript_list:
            print(f"  - {transcript.language} (Code: {transcript.language_code})")
            print(f"    Auto-generated: {transcript.is_generated}")
            print(f"    Translatable: {transcript.is_translatable}")

        # Try to fetch English transcript
        print("\nAttempting to fetch English transcript...")
        try:
            # Try manual English first
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            print(f"✅ Found English transcript with {len(transcript)} entries")
            print("\nFirst 3 entries:")
            for entry in transcript[:3]:
                print(f"  {entry['start']:.2f}s: {entry['text']}")
            return True
        except Exception as e:
            print(f"❌ Could not get English transcript: {e}")

            # Try to get any available transcript
            print("\nTrying to fetch any available transcript...")
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            for t in transcript_list:
                try:
                    transcript = t.fetch()
                    print(f"✅ Got transcript in {t.language} with {len(transcript)} entries")
                    print("\nFirst 3 entries:")
                    for entry in transcript[:3]:
                        print(f"  {entry['start']:.2f}s: {entry['text']}")
                    return True
                except:
                    continue

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

# Test videos
test_videos = [
    "xyQY8a-ng6g",  # TED-Ed video you mentioned
    "tRSLUwNWEAQ",  # Another Alzheimer's video with English captions
    "QjL60GJJfGg",  # Alzheimer's Association video
]

for video_id in test_videos:
    test_transcript(video_id)

print("\n" + "="*50)
print("Testing complete!")