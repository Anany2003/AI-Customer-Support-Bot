import React from "react";

export default function TypingIndicator(){
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none shadow-sm">
        <div className="flex items-center space-x-1">
          <Dot />
          <Dot delay="150" />
          <Dot delay="300" />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0" }){
  return (
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
  );
}
