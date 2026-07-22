import os
import sys
from pathlib import Path

# Add parent directory to path to allow backend package imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from backend.rag import generate_analysis

# Load environment key
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
api_key = os.getenv("GEMINI_API_KEY")

print(f"API Key present: {bool(api_key)}")

if api_key:
    print("\nRunning Online Generation Test (sending request to Google Gemini)...")
    result = generate_analysis(
        case_title="Cyber Cafe Intrusion & Theft",
        description="A group of masked men shattered the front glass door and stole hard drives containing user database logs.",
        location="Sector 62, Noida",
        date="2026-07-16 02:00 AM",
        evidence="Shattered glass, CCTV footage of intruders",
        witness="Security guard Ram Singh",
        api_key=api_key
    )
    
    print("\n[TEST RESULT]")
    print(f"Matched Citations: {result['citations']}")
    print("-" * 50)
    print("Analysis Output Snippet:")
    print(result["analysis"][:600])
    print("-" * 50)
    
    if "Error" in result["analysis"]:
        print("\n[FAIL] ONLINE TEST FAILED: Error detected in generated response.")
    else:
        print("\n[PASS] ONLINE TEST PASSED: Gemini successfully generated the legal draft and summary!")
else:
    print("No GEMINI_API_KEY found. Make sure backend/.env has the key.")
