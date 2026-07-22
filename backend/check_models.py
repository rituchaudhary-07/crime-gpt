import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key present: {bool(api_key)}")

if api_key:
    try:
        genai.configure(api_key=api_key)
        print("Available models:")
        for m in genai.list_models():
            print(f" - {m.name} (supports: {m.supported_generation_methods})")
    except Exception as e:
        print(f"Error listing models: {e}")
else:
    print("No API Key found in backend/.env")
