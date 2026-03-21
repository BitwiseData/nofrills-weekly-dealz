"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";

interface Props {
  open: boolean;
  onClose: () => void;
}

function getMessageText(msg: UIMessage): string {
  if (!msg.parts) return "";
  return msg.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

export default function ChatDrawer({ open, onClose }: Props) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage({ text });
  };

  const handleSuggestion = async (text: string) => {
    if (isLoading) return;
    await sendMessage({ text });
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#fff" }}
      >
        {/* Drawer header */}
        <div style={{ background: "#003d28" }} className="px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">✨ AI Deal Assistant</h2>
            <p className="text-xs" style={{ color: "#91d520" }}>Ask about this week&apos;s deals</p>
          </div>
          <button
            onClick={onClose}
            className="text-white text-2xl leading-none hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <div className="text-5xl mb-3">🤖</div>
              <p className="font-medium text-gray-600">Hi! I can help you find the best deals.</p>
              <p className="text-sm mt-1">Try asking:</p>
              <div className="mt-3 flex flex-col gap-2">
                {[
                  "What's on sale in produce?",
                  "What are the cheapest items?",
                  "Any pantry deals this week?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:border-green-300 text-left transition-colors cursor-pointer"
                    style={{ color: "#003d28" }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;
            return (
              <div
                key={msg.id}
                className={`chat-message flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "#003d28", color: "white", borderBottomRightRadius: "4px" }
                      : { background: "#f0f7eb", color: "#1a2e1a", borderBottomLeftRadius: "4px" }
                  }
                >
                  {text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="px-4 py-2 rounded-2xl text-sm"
                style={{ background: "#f0f7eb", color: "#003d28", borderBottomLeftRadius: "4px" }}
              >
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about deals..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40 cursor-pointer"
              style={{ background: "#003d28", color: "white" }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
