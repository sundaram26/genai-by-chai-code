"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import { Bot, Loader2, Send, UserRound } from "lucide-react";
import Image from "next/image";

type PersonaId = "piyush" | "hitesh";
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const PERSONAS: Array<{ id: PersonaId; name: string; handle: string; image: string }> = [
  { id: "piyush", name: "Piyush Garg", handle: "piyush.md", image: "/piyush.png" },
  { id: "hitesh", name: "Hitesh Chaudhary", handle: "hitesh.md", image: "/hitesh.png" },
];

function parseOpenAIStreamLines(payload: string) {
  return payload
    .split("\n\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6).trim())
    .filter((line) => line && line !== "[DONE]")
    .map((line) => {
      try {
        return JSON.parse(line).choices?.[0]?.delta?.content || "";
      } catch {
        return "";
      }
    })
    .join("");
}

export default function PersonaChat() {
  const [persona, setPersona] = useState<PersonaId>("piyush");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedPersona = PERSONAS.find((item) => item.id === persona)!;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage];

    setMessages([...nextMessages, assistantMessage]);
    setInput("");
    setError(null);
    setIsStreaming(true);

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    try {
      const response = await fetch("/api/persona/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Persona API request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lastEventBoundary = streamBuffer.lastIndexOf("\n\n");
        if (lastEventBoundary === -1) continue;

        const completePayload = streamBuffer.slice(0, lastEventBoundary);
        streamBuffer = streamBuffer.slice(lastEventBoundary + 2);

        const textChunk = parseOpenAIStreamLines(completePayload);
        if (!textChunk) continue;

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: message.content + textChunk }
              : message,
          ),
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = null;
    }
  }

  function handlePersonaChange(nextPersona: PersonaId) {
    streamAbortRef.current?.abort();
    setPersona(nextPersona);
    setMessages([]);
    setError(null);
  }

  return (
    <main className="fixed inset-0 bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col">
      <div className="mx-auto flex flex-1 min-h-0 w-full max-w-4xl flex-col px-6 pt-12 pb-6">
        <header className="mb-8 flex flex-col gap-6 border-b border-neutral-200 pb-8 md:flex-row md:items-end md:justify-between shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Persona Chat
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
              Chat as {selectedPersona.name}
            </h1>
          </div>

          <div className="flex border-b border-neutral-200">
            {PERSONAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (persona !== item.id) {
                    setPersona(item.id);
                    setMessages([]);
                    setError(null);
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                  persona === item.id
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-6 border border-neutral-200 bg-neutral-50 p-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 bg-white border border-neutral-200 text-neutral-600 overflow-hidden">
              <Image 
                src={selectedPersona.image} 
                alt={selectedPersona.name} 
                fill 
                className="object-cover object-top" 
              />
            </div>
            <div>
              <p className="font-medium text-neutral-900">{selectedPersona.name}</p>
              <p className="text-sm font-light text-neutral-500 mt-1">
                System prompt loaded from <code className="bg-white border border-neutral-200 px-1 py-0.5 text-xs font-mono">packages/persona/personas/{selectedPersona.handle}</code>
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col border border-neutral-200 bg-white">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-80 items-center justify-center text-center text-neutral-400 font-light">
                Ask a question and the backend will stream using the selected markdown persona.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="mt-1 relative h-8 w-8 shrink-0 bg-neutral-100 border border-neutral-200 text-neutral-600 overflow-hidden">
                      <Image 
                        src={selectedPersona.image} 
                        alt={selectedPersona.name} 
                        fill 
                        className="object-cover object-top" 
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-neutral-900 text-white font-light"
                        : "border border-neutral-200 bg-white text-neutral-800 font-light"
                    }`}
                  >
                    {message.content || (
                      <span className="inline-flex items-center gap-2 text-neutral-400">
                        <Loader2 size={14} className="animate-spin" />
                        Streaming
                      </span>
                    )}
                  </div>
                  {message.role === "user" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center bg-neutral-100 border border-neutral-200 text-neutral-600">
                      <UserRound size={16} />
                    </span>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="border-t border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-4 border-t border-neutral-200 bg-neutral-50 p-6"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isStreaming}
              placeholder={`Message ${selectedPersona.name}`}
              className="min-w-0 flex-1 border border-neutral-300 bg-white px-5 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="inline-flex items-center justify-center bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
