import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InputBar from "./InputBar";
import axios from "axios";

const STORAGE_KEY = "ai_support_chat_v1";
axios.defaults.baseURL = "http://localhost:8000";

function loadMessages(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function ChatWindow(){
  const [messages, setMessages] = useState(loadMessages());
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Date.now()}`); // simple session 
  const containerRef = useRef();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    // scroll to bottom
    if(containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text, userEmail = null){
    const userMsg = { id: Date.now()+"_u", role: "user", text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // show typing indicator (client side)
    setMessages(prev => [...prev, { id: "typing", role: "typing" }]);

    try {
      const resp = await axios.post("/chat", {
        session_id: sessionId,
        message: text,
        user_email: userEmail
      });
      const payload = resp.data;
      // remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== "typing"));

      if(payload.action === "escalate_request"){
        // backend says: we couldn't find helpful answer -> ask user to escalate
        setMessages(prev => [
          ...prev,
          { id: Date.now()+"_b", role: "bot", text: payload.message || "I couldn't find an answer. Would you like to escalate?" , ts: Date.now(), escalate: true }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { id: Date.now()+"_b", role: "bot", text: payload.message || "Sorry, something went wrong.", ts: Date.now() }
        ]);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== "typing"));
      setMessages(prev => [
        ...prev,
        { id: Date.now()+"_e", role: "bot", text: "Error connecting to server. Please try again later." }
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function clearChat(){
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }

  // handle escalation consent from user (yes/no) and email capture
  async function handleEscalationConsent(consent) {
  if (!consent) {
    setMessages(prev => [...prev, { id: Date.now()+"_b", role: "bot", text: "Okay — no escalation. How else can I help?" }]);
    return;
  }

  // Step 1: Ask user for query and email
  const userInput = window.prompt(
    "Please type your query and your contact email (for example: 'Refund not processed — mymail@example.com'):"
  );

  if (!userInput || userInput.trim() === "") {
    setMessages(prev => [
      ...prev,
      { id: Date.now()+"_b", role: "bot", text: "No details provided. Escalation cancelled." }
    ]);
    return;
  }

  // Step 2: Show acknowledgement
  setMessages(prev => [
    ...prev,
    { id: Date.now()+"_b", role: "bot", text: "Thanks — escalating now. Support will contact you soon." }
  ]);

  try {
    await axios.post("http://localhost:8000/escalate", {
      query: userInput,
      metadata: { session_id: sessionId, timestamp: Date.now() },
      user_email: userInput.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] || "unknown"
    });
  } catch (err) {
    console.error(err);
    setMessages(prev => [
      ...prev,
      { id: Date.now()+"_b", role: "bot", text: "Failed to send escalation — please try again later." }
    ]);
  }
}


  // When user clicks an "Escalate" button in the UI for a bot message
  function onEscalateClick(originalQuery){
    handleEscalationConsent(true, originalQuery);
  }

  // Render
  return (
    <div className="bg-white flex flex-col h-[80vh]">
      <div className="bg-gradient-to-r from-indigo-500 to-pink-400 p-4 text-white">
        <h1 className="text-xl font-semibold">AI Customer Support</h1>
        <p className="text-sm opacity-90">Ask anything — chat persists in your browser</p>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && <div className="text-center text-gray-500">Say hi 👋</div>}
        {messages.map(msg => {
          if(msg.role === "typing") return <TypingIndicator key="typing" />;
          return (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              text={msg.text}
              onEscalate={() => handleEscalationConsent(true)}
              escalateAvailable={!!msg.escalate}
            />
          );
        })}
      </div>

      <div className="p-4 border-t bg-white">
        <InputBar
          onSend={sendMessage}
          onClear={clearChat}
          loading={loading}
        />
      </div>
    </div>
  );
}
