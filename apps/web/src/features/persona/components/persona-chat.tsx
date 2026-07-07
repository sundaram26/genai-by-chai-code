"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, Loader2, Send, UserRound } from "lucide-react";

type PersonaId = "piyush" | "hitesh";
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const PERSONAS: Array<{ id: PersonaId; name: string; handle: string }> = [
  { id: "piyush", name: "Piyush Garg", handle: "piyush.md" },
  { id: "hitesh", name: "Hitesh Chaudhary", handle: "hitesh.md" },
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
              Persona Chat
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              Chat as {selectedPersona.name}
            </h1>
          </div>

          <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
            {PERSONAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePersonaChange(item.id)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  persona === item.id
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-cyan-300">
              <Bot size={20} />
            </span>
            <div>
              <p className="font-bold">{selectedPersona.name}</p>
              <p className="text-sm text-slate-400">
                System prompt loaded from `packages/persona/personas/{selectedPersona.handle}`.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-80 items-center justify-center text-center text-slate-500">
                Ask a question and the backend will stream using the selected markdown persona.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-300">
                      <Bot size={16} />
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-cyan-400 text-slate-950"
                        : "border border-slate-800 bg-slate-950 text-slate-100"
                    }`}
                  >
                    {message.content || (
                      <span className="inline-flex items-center gap-2 text-slate-500">
                        <Loader2 size={14} className="animate-spin" />
                        Streaming
                      </span>
                    )}
                  </div>
                  {message.role === "user" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                      <UserRound size={16} />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="border-t border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-3 border-t border-slate-800 p-4"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isStreaming}
              placeholder={`Message ${selectedPersona.name}`}
              className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
