from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import uuid
from dotenv import load_dotenv
from rag import extract_text_from_pdf
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from fastapi import Request

load_dotenv()
app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"reply": "Too many requests! Please wait a moment before sending again."}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = Groq(api_key=os.getenv("OPENAI_API_KEY"))
sessions = {}
pdf_text = ""
SYSTEM_PROMPT = "You are a helpful friendly AI assistant. Answer questions clearly and honestly."
class ChatRequest(BaseModel):
    session_id: str
    message: str
class ChatResponse(BaseModel):
    reply: str

@app.post("/new-session")
def create_new_session():
    session_id = str(uuid.uuid4())
    sessions[session_id] = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]
    return {"session_id": session_id}

@app.post("/chat")
@limiter.limit("5/minute")
def chat(request: Request, chatrequest: ChatRequest):
    if chatrequest.session_id not in sessions:
        return {"reply": "Session not found. Please refresh!"}
    history = sessions[chatrequest.session_id]
    history.append({
        "role": "user",
        "content": chatrequest.message
    })
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=history,
        temperature=0.7,
        max_tokens=500
    )
    ai_reply = response.choices[0].message.content
    history.append({"role": "assistant", "content": ai_reply})
    return ChatResponse(reply=ai_reply)

@app.get("/")
def root():
    return {"status": "ok", "message": "Chatbot backend is running!"}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global pdf_text
    file_bytes = await file.read()
    pdf_text = extract_text_from_pdf(file_bytes)
    return {"message": f"PDF uploaded! Extracted {len(pdf_text)} characters."}

@app.post("/chat-with-pdf")
@limiter.limit("5/minute")
def chat_with_pdf(request: Request, chatrequest: ChatRequest):
    if not pdf_text:
        return ChatResponse(reply="Please upload a PDF first!")
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Answer questions using only the document provided."},
        {"role": "user", "content": f"Document:\n{pdf_text}\n\nQuestion: {chatrequest.message}"}
    ]
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.3,
        max_tokens=500
    )
    ai_reply = response.choices[0].message.content
    return ChatResponse(reply=ai_reply)