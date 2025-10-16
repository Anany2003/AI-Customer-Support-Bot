import React, { useState } from "react";

export default function InputBar({ onSend, onClear, loading }){
  const [text, setText] = useState("");

  function handleSend(){
    if(!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  function onKeyDown(e){
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
        className="flex-1 border rounded-md p-3 resize-none h-12"
      />
      <div className="flex items-center space-x-2">
        <button onClick={handleSend} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded shadow">
          {loading ? "Sending..." : "Send"}
        </button>
        <button onClick={onClear} className="px-3 py-2 border rounded">Clear Chat</button>
      </div>
    </div>
  );
}
