#!/usr/bin/env python3
"""Test if Groq SDK has audio transcription capability."""

import os
from groq import Groq

# Get API key from environment or settings
api_key = os.getenv('GROQ_API_KEY', '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')

try:
    client = Groq(api_key=api_key)

    # Check if client has audio attribute
    if hasattr(client, 'audio'):
        print("✅ Groq client has 'audio' attribute")

        if hasattr(client.audio, 'transcriptions'):
            print("✅ Groq client.audio has 'transcriptions' attribute")
        else:
            print("❌ Groq client.audio does NOT have 'transcriptions' attribute")
    else:
        print("❌ Groq client does NOT have 'audio' attribute")
        print(f"Available attributes: {dir(client)}")

except Exception as e:
    print(f"Error: {e}")

# Check Groq SDK version
import groq
print(f"\nGroq SDK version: {groq.__version__ if hasattr(groq, '__version__') else 'Unknown'}")