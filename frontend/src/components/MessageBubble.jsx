import React from "react";

export default function MessageBubble({ role, text, escalateAvailable=false, onEscalate }){
  if(role === "user"){
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-blue-50 text-blue-900 p-3 rounded-lg rounded-tr-none shadow-sm">
          <div className="whitespace-pre-wrap">{text}</div>
        </div>
      </div>
    );
  } else { // bot or other
    return (
      <div className="flex justify-start">
        <div className="max-w-[75%] bg-gray-100 text-gray-900 p-3 rounded-lg rounded-tl-none shadow-sm">
          <div className="whitespace-pre-wrap">{text}</div>
          {escalateAvailable && (
            <div className="mt-2 flex items-center space-x-2">
              <button onClick={onEscalate} className="px-3 py-1 bg-indigo-600 text-white rounded">Yes, escalate</button>
              <button onClick={() => alert("Okay, no escalation.")} className="px-3 py-1 border rounded">No</button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
