"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Sparkles, Loader2, Bot } from "lucide-react";

type Role = "user" | "assistant";
interface Message {
  id: string;
  role: Role;
  content: string;
}

export default function PremiumPersonaChat() {
  const [personas, setPersonas] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load available compiled personas
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const res = await fetch("/api/persona/list");
        if (res.ok) {
          const data = await res.json();
          const names = data.personas.map((p: any) => p.identity.name);
          setPersonas(names);
          if (names.length > 0) {
            setSelectedPersona(names[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load personas:", err);
      }
    };
    fetchPersonas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPersona) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/persona/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          personaName: selectedPersona
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to persona API");
      }

      // Add a blank assistant message to start appending chunks
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunkValue = decoder.decode(value, { stream: !done });
          // Vercel AI SDK text streams sometimes start with '0:"chunk"' format in v4,
          // We will parse out standard text or naive chunks.
          // For simplicity, we just strip the data stream wrapper if it exists:
          const textChunk = chunkValue.replace(/^[0-9]+:"/gm, '').replace(/"$/gm, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
          
          setMessages((prev) => {
            const current = [...prev];
            const lastMessage = current[current.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content += textChunk;
            }
            return current;
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 font-sans flex flex-col items-center p-4 md:p-8">
      
      {/* Premium Header */}
      <header className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4 backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              AI Persona Simulator
            </h1>
            <p className="text-xs text-slate-400 font-medium">Real-time dynamic character generation</p>
          </div>
        </div>

        {/* Persona Selector Dropdown */}
        <div className="flex items-center gap-3 bg-slate-950/50 p-2 border border-slate-800/80 rounded-xl shadow-inner">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            Active Persona:
          </label>
          <select
            value={selectedPersona}
            onChange={(e) => {
              setSelectedPersona(e.target.value);
              setMessages([]); // Clear chat on switch
            }}
            className="bg-slate-900 text-indigo-300 font-bold border border-slate-700/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg cursor-pointer transition-all hover:bg-slate-800"
          >
            {personas.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            {personas.length === 0 && <option>No personas compiled yet</option>}
          </select>
        </div>
      </header>

      {/* Glassmorphic Chat Container */}
      <div className="w-full max-w-4xl flex-1 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
              <Bot size={48} className="mb-4 text-slate-600" />
              <p className="font-medium">Send a message to start simulating {selectedPersona || "a persona"}.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[85%] md:max-w-[75%] ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    m.role === "user" 
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" 
                      : "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 text-cyan-400"
                  }`}>
                    {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-xl backdrop-blur-md whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-indigo-600/90 text-white rounded-tr-sm border border-indigo-500/50"
                        : "bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex w-full justify-start">
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-3 backdrop-blur-sm">
                <Loader2 size={16} className="text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Generating response...</span>
              </div>
            </div>
          )}
          {error && (
             <div className="flex w-full justify-center">
                <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-xs">
                  Error: {error}
                </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form Area */}
        <div className="p-4 bg-slate-950/60 border-t border-white/5 backdrop-blur-2xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !selectedPersona}
              placeholder={`Chat with ${selectedPersona || "..."}`}
              className="w-full bg-slate-900/80 text-slate-200 border border-slate-700/50 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent shadow-inner transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !selectedPersona}
              className="absolute right-2 p-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 rounded-xl text-white shadow-lg disabled:opacity-50 disabled:grayscale transition-all transform active:scale-95 flex items-center justify-center"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              Powered by Raw Streaming
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
