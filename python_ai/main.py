import asyncio
import nest_asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import g4f
from g4f.client import Client

app = FastAPI(title="EduConnect Local AI", version="1.0")
client = None

@app.on_event("startup")
async def startup_event():
    global client
    nest_asyncio.apply()
    client = Client()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "provider": "g4f"}

@app.post("/chat")
def chat_completion(request: ChatRequest):
    global client
    if client is None:
        nest_asyncio.apply()
        client = Client()
    try:
        # Build the message history
        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})
        # Auto-finding best functioning free provider (g4f 7.3.0 automatically handles fallbacks)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )

        content = response.choices[0].message.content

        return {
            "response": content,
        }

    except Exception as e:
        print(f"AI Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    # Run the server on port 8000
    reload_enabled = os.getenv("PYTHON_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=reload_enabled, loop="asyncio")
