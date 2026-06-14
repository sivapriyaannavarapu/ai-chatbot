import { useState, useEffect, useRef } from "react";
import "./App.css";
function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
const [chatMode, setChatMode] = useState("normal");
  const messagesEndRef = useRef(null);
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch("http://localhost:8000/new-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        setSessionId(data.session_id);
        setMessages([{ role: "ai", text: "Hello Siva! How can I help you today?" }]);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };
    createSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionId) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setIsLoading(true);
    try {
      const endpoint = chatMode === "pdf" ? "http://localhost:8000/chat-with-pdf" : "http://localhost:8000/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userText,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };


  const uploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://localhost:8000/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPdfUploaded(true);
      setMessages((prev) => [...prev, { role: "ai", text: "✅ PDF uploaded! You can now ask questions about it." }]);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div className="chat-container">
<div className="chat-header">
        <h2>🤖 AI Chatbot</h2>
        <div className="mode-switcher">
          <button
            className={chatMode === "normal" ? "mode-btn active" : "mode-btn"}
            onClick={() => setChatMode("normal")}
          >
            Normal Chat
          </button>
          <button
            className={chatMode === "pdf" ? "mode-btn active" : "mode-btn"}
            onClick={() => setChatMode("pdf")}
          >
            PDF Chat
          </button>
          <input type="file" accept=".pdf" onChange={uploadPdf} id="pdf-upload" style={{ display: "none" }} />
          <label htmlFor="pdf-upload" className="upload-btn">
            {pdfUploaded ? "✅ PDF Ready" : "📄 Upload PDF"}
          </label>
        </div>
      </div>
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={msg.role === "user" ? "user-bubble" : "ai-bubble"}>
            <span className="message-role">{msg.role === "user" ? "You" : "AI"}</span>
            <p className="message-text">{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className="ai-bubble">
            <span className="message-role">AI</span>
            <p className="message-text">● ● ●</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          className="message-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button className="send-button" onClick={sendMessage} disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;