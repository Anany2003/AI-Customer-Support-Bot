import json
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import difflib
import requests
from email_util import send_email
from typing import Optional

# Load config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
if not os.path.exists(CONFIG_PATH):
    CONFIG = {}
else:
    with open(CONFIG_PATH, "r") as f:
        CONFIG = json.load(f)

FAQ_PATH = os.path.join(os.path.dirname(__file__), "faq.json")
with open(FAQ_PATH, "r") as f:
    FAQ = json.load(f)

OPENROUTER_KEY = CONFIG.get("openrouter_api_key")
OPENROUTER_URL = CONFIG.get("openrouter_api_url", "https://openrouter.ai/api/v1/chat/completions")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_email: Optional[str] = None

class EscalateRequest(BaseModel):
    query: str
    metadata: dict
    user_email: str

def find_best_faq(query: str):
    # naive similarity: compare query against FAQ questions using difflib ratio
    best = None
    best_score = 0.0
    for item in FAQ:
        score = difflib.SequenceMatcher(None, query.lower(), item["question"].lower()).ratio()
        if score > best_score:
            best_score = score
            best = item
    return best, best_score

def query_openrouter(prompt: str):
    if not OPENROUTER_KEY:
        raise RuntimeError("OpenRouter API key not configured (set config.json).")
    body = {
        "model": "openai/gpt-4.1-mini",  # replace with the model you want; configurable
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 512
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.post(OPENROUTER_URL, headers=headers, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    # This depends slightly on OpenRouter response shape; try to extract text.
    # Try common shapes:
    if "choices" in data and len(data["choices"])>0:
        msg = data["choices"][0].get("message", {}).get("content") or data["choices"][0].get("text")
        return msg
    # fallback
    return data.get("message") or json.dumps(data)

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # Step 1: check FAQ
    best, score = find_best_faq(req.message)
    if best and score >= 0.8:
        return {"action": "answer", "message": best["answer"], "source": "faq", "score": score}

    # Step 2: ask LLM (OpenRouter)
    try:
        # More structured instruction
        system_prompt = """
        You are a customer-support assistant.
        You have access to only the company's FAQ and standard greeting phrases.
        If the user greets you (like 'hi', 'hello', etc.), respond politely and briefly.
        If the question is about something in the FAQ, you can answer helpfully.
        But if the user asks something outside of those areas or unrelated to support,
        reply EXACTLY with: NO_ANSWER.
        Respond ONLY with 'NO_ANSWER' if you are not confident or if the query is unrelated to support.
        Do NOT attempt to answer based on general knowledge.
        Do NOT attempt to answer on topics not in the FAQs
        """

        prompt = f"{system_prompt}\n\nUser query: {req.message}"
        answer = query_openrouter(prompt)

        if not answer or "NO_ANSWER" in answer:
            return {
                "action": "escalate_request",
                "message": "I'm not sure about that. Would you like me to escalate this to a human support representative?"
            }

        return {"action": "answer", "message": answer.strip(), "source": "llm"}

    except Exception as e:
        print("LLM error:", e)
        return {"action": "escalate_request", "message": "I couldn't find a helpful answer."}


@app.post("/escalate")
async def escalate_endpoint(req: EscalateRequest):
    smtp_cfg = CONFIG.get("smtp")
    support_email = CONFIG.get("support_email")
    if not smtp_cfg or not support_email:
        return {"status": "error", "message": "Email not configured on server."}
    # Send an email to support containing the query and user contact
    subject = "Escalation request from AI bot"
    body = f"""Escalation Details:

Query:
{req.query}

Metadata:
{json.dumps(req.metadata, indent=2)}

User contact:
{req.user_email}
"""
    try:
        send_email(smtp_cfg, support_email, subject, body)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
