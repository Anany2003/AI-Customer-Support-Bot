import React from "react";
import ChatWindow from "./components/ChatWindow";

export default function App(){
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl shadow-2xl rounded-2xl overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
