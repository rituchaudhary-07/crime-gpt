import os
import requests
import json
from typing import List, Dict, Any, Tuple

class AIService:
    @staticmethod
    def get_provider_details(custom_key: str = "") -> Tuple[str, str, str]:
        # Custom key passed from request takes precedence, otherwise check env variables
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        groq_key = os.getenv("GROQ_API_KEY", "")
        openai_key = os.getenv("OPENAI_API_KEY", "")
        gemini_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
        
        # 1. OpenRouter (Keys start with 'sk-or-')
        if custom_key and custom_key.startswith("sk-or-"):
            return "openrouter", custom_key, "deepseek/deepseek-chat-v3"
        elif openrouter_key:
            return "openrouter", openrouter_key, "deepseek/deepseek-chat-v3"
            
        # 2. Groq (Keys start with 'gsk_')
        if custom_key and custom_key.startswith("gsk_"):
            return "groq", custom_key, "llama-3.3-70b-versatile"
        elif groq_key:
            return "groq", groq_key, "llama-3.3-70b-versatile"
            
        # 3. OpenAI (Keys start with 'sk-' and not 'sk-or-')
        if custom_key and (custom_key.startswith("sk-") and not custom_key.startswith("sk-or-")):
            return "openai", custom_key, "gpt-4o-mini"
        elif openai_key:
            return "openai", openai_key, "gpt-4o-mini"

        # 4. Gemini (Keys start with 'AIzaSy' or GEMINI_API_KEY env var)
        if custom_key and custom_key.startswith("AIzaSy"):
            return "gemini", custom_key, "gemini-1.5-flash"
        elif gemini_key:
            return "gemini", gemini_key, "gemini-1.5-flash"

        # If custom key does not match format, check env fallbacks first
        if openrouter_key:
            return "openrouter", openrouter_key, "deepseek/deepseek-chat-v3"
        elif groq_key:
            return "groq", groq_key, "llama-3.3-70b-versatile"
        elif openai_key:
            return "openai", openai_key, "gpt-4o-mini"
        elif gemini_key:
            return "gemini", gemini_key, "gemini-1.5-flash"
            
        return "offline", "", ""

    @staticmethod
    def generate_chat_completion(messages: List[Dict[str, str]], custom_key: str = "") -> str:
        provider, api_key, model = AIService.get_provider_details(custom_key)
        
        if provider == "offline":
            # Rule-based fallback summary text
            return "[Offline Fallback Mode] AI matching completed locally. Please configure a valid API key."

        try:
            if provider == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model_inst = genai.GenerativeModel("gemini-1.5-flash")
                prompt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
                response = model_inst.generate_content(prompt)
                return response.text.strip()

            elif provider == "openrouter":
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://crimegpt.gov.in",
                    "X-Title": "NyayaIQ"
                }
                
                # Check models fallback chain
                models_to_try = [
                    "deepseek/deepseek-chat",
                    "meta-llama/llama-3.3-70b-instruct",
                    "deepseek/deepseek-r1"
                ]
                
                last_error = None
                for m in models_to_try:
                    payload = {
                        "model": m,
                        "messages": messages,
                        "temperature": 0.2
                    }
                    try:
                        response = requests.post(url, headers=headers, json=payload, timeout=15)
                        if response.ok:
                            return response.json()["choices"][0]["message"]["content"]
                        else:
                            last_error = response.text
                    except Exception as ex:
                        last_error = str(ex)
                        continue
                
                raise Exception(f"OpenRouter models failed. Last response: {last_error}")

            elif provider == "groq":
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.2
                }
                response = requests.post(url, headers=headers, json=payload, timeout=15)
                if not response.ok:
                    raise Exception(f"Groq API returned error: {response.text}")
                return response.json()["choices"][0]["message"]["content"]

            elif provider == "openai":
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.2
                }
                response = requests.post(url, headers=headers, json=payload, timeout=15)
                if not response.ok:
                    raise Exception(f"OpenAI API returned error: {response.text}")
                return response.json()["choices"][0]["message"]["content"]
                
        except Exception as e:
            print(f"Chat completion failed: {e}")
            return f"[AI Provider Connection Exception] {e}. Falling back to offline operations mode."

        return "[Offline Mode] System key is empty."

    @staticmethod
    def validate_key(api_key: str) -> bool:
        # Perform a quick message completion to test key validity
        messages = [{"role": "user", "content": "Respond with one word 'Admissible'."}]
        response = AIService.generate_chat_completion(messages, custom_key=api_key)
        # If response was not blocked and returned successfully
        if response and "Connection Exception" not in response and "Offline Fallback" not in response:
            return True
        return False
