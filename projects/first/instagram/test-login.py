"""
Test Instagram login with instagrapi
"""
from instagrapi import Client
import json
import sys

# Test basic connection
cl = Client()

try:
    # Try login - credentials will be provided by user
    # For now, just test the library loads correctly
    print("instagrapi loaded successfully")
    print(f"Version: {cl.__class__.__module__}")

    # List available methods for DM
    dm_methods = [m for m in dir(cl) if 'direct' in m.lower()]
    print(f"\nDirect Message methods available ({len(dm_methods)}):")
    for m in dm_methods:
        print(f"  - {m}")

    # List methods for user search
    user_methods = [m for m in dir(cl) if 'user' in m.lower() and 'search' in m.lower()]
    print(f"\nUser search methods ({len(user_methods)}):")
    for m in user_methods:
        print(f"  - {m}")

    print("\nREADY: Library works. Need Instagram credentials to proceed.")

except Exception as e:
    print(f"Error: {e}")
