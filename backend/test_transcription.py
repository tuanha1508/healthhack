#!/usr/bin/env python3
"""Test transcription with a sample audio file."""

import requests
import os

# Test with a small audio file
api_url = "http://localhost:8000/api/transcribe/"

# Create a tiny test audio file (even empty will help us test)
test_audio_content = b"test audio content"

files = {
    'audio': ('test.webm', test_audio_content, 'audio/webm')
}

try:
    print("Sending test audio to transcription API...")
    response = requests.post(api_url, files=files)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

except Exception as e:
    print(f"Error: {e}")