#!/usr/bin/env python3
"""Test Groq SDK version and capabilities in the virtual environment."""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, '/Users/tuna/Desktop/healthhack/backend')

# Activate virtual environment
activate_this = '/Users/tuna/Desktop/healthhack/backend/venv/bin/activate_this.py'
if os.path.exists(activate_this):
    exec(open(activate_this).read(), {'__file__': activate_this})

try:
    import groq
    from groq import Groq

    print(f"✅ Groq module imported successfully")
    print(f"Groq version: {groq.__version__ if hasattr(groq, '__version__') else 'Unknown'}")
    print(f"Groq module location: {groq.__file__}")

    # Test client creation
    client = Groq(api_key="test_key")
    print(f"\n✅ Groq client created")

    # Check for audio attribute
    if hasattr(client, 'audio'):
        print("✅ Client has 'audio' attribute")
        if hasattr(client.audio, 'transcriptions'):
            print("✅ Client.audio has 'transcriptions' attribute")
            print("✅ Ready for audio transcription!")
        else:
            print("❌ Client.audio does NOT have 'transcriptions' attribute")
    else:
        print("❌ Client does NOT have 'audio' attribute")
        print(f"Available attributes: {[attr for attr in dir(client) if not attr.startswith('_')]}")

except ImportError as e:
    print(f"❌ Failed to import groq: {e}")
except Exception as e:
    print(f"❌ Error: {e}")