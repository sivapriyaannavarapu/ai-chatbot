# 🤖 AI Chatbot

A full-stack AI chatbot built with FastAPI and React, powered by Groq AI (LLaMA 3 model).

## ✨ Features
- 💬 Real-time AI chat with conversation memory
- 📄 RAG — Chat with your own PDF documents
- 🔒 Rate limiting (5 requests/minute per user)
- 🔑 Secure API key management with .env

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, Groq AI (LLaMA 3)
- **Frontend:** React.js
- **AI:** LLaMA 3 model via Groq API
- **Security:** python-dotenv, slowapi rate limiting

## 🚀 How to Run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install fastapi uvicorn groq python-dotenv pypdf python-multipart slowapi
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend/chatbot-ui
npm install
npm start
```

## 📸 How It Works
1. User opens chat at http://localhost:3000
2. React creates a session with FastAPI backend
3. Messages are sent to Groq AI with full conversation history
4. For PDF chat — upload any PDF and ask questions about it!

## 🔐 Setup
Create a `.env` file in backend folder:

OPENAI_API_KEY=your-groq-api-key
Get your free Groq API key at: https://console.groq.com