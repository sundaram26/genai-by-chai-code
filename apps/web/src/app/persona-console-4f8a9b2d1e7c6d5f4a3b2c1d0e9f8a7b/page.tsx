"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  Terminal,
  UserCheck,
  Youtube,
  Twitter,
  Globe,
  FileText,
  Send,
  Eye,
  Settings,
  Check,
  MessageSquare
} from "lucide-react";

interface PersonaCard {
  identity: {
    name: string;
    public_role: string;
    teaching_scope: string[];
    audience: string;
    subject_boundaries: string[];
    known_for: string[];
  };
  communication: {
    tone: string[];
    sentence_length: string;
    humor_level: string;
    directness: string;
    start_patterns: string[];
    end_patterns: string[];
    correction_style: string;
    motivation_style: string;
  };
  platform_modes: Record<string, {
    tone: string;
    style_rules: string[];
    constraints: string[];
  }>;
  phrase_bank: string[];
  anti_style: string[];
  knowledge: string[];
  example_replies: Array<{
    question: string;
    answer: string;
    platform: string;
    mood: string;
    intent: string;
  }>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  debug?: {
    is_mock?: boolean;
    pass1_plan: {
      intent: string;
      points_to_include: string[];
      briefness_level: string;
    };
    pass2_draft: string;
    pass3_verification: {
      score: number;
      over_politeness: boolean;
      generic_voice: boolean;
      feedback: string;
    };
  };
}

export default function SimplePersonaDashboard() {
  // Input fields (Raw Textareas)
  const [name, setName] = useState("Hitesh");
  const [youtubeText, setYoutubeText] = useState("https://youtube.com/watch?v=123");
  const [websiteText, setWebsiteText] = useState("https://hiteshchoudhary.com/about");
  const [tweetsText, setTweetsText] = useState("Bro, coding is simple. Keep logic clean.\nDon't write boilerplates, simple hai.");
  const [commentsText, setCommentsText] = useState("Explain simply.\nCoding is simple, guys.");
  const [additionalText, setAdditionalText] = useState("See? Coding is simple. Def getData. Fail if you overcomplicate.");

  const [compiling, setCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<string[]>([]);
  
  // Personas selection
  const [personas, setPersonas] = useState<PersonaCard[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<PersonaCard | null>(null);

  // Chat simulator
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [platform, setPlatform] = useState<"youtube" | "twitter" | "live" | "formal">("youtube");
  const [styleStrength, setStyleStrength] = useState(0.8);
  const [detailLevel, setDetailLevel] = useState<"brief" | "balanced" | "detailed">("balanced");
  const [sending, setSending] = useState(false);
  const [activeDebugIndex, setActiveDebugIndex] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<"identity" | "style" | "vocabulary" | "examples" | "raw">("identity");

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "@sundaram_04") {
      setIsAuthenticated(true);
    } else {
      alert("Access Denied: Incorrect Password");
    }
  };

  const loadPersonas = async () => {
    try {
      const res = await fetch("/api/persona/list");
      if (res.ok) {
        const data = await res.json();
        setPersonas(data.personas || []);
        if (data.personas?.length > 0 && !selectedPersona) {
          setSelectedPersona(data.personas[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load personas:", err);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleCompile = async () => {
    if (!name.trim()) return;
    setCompiling(true);
    setCompileStatus(["Running ingest phase...", "Cleaning inputs...", "LLM profiling chunk features...", "Map-Reduce merge cards..."]);

    const ytList = youtubeText.split("\n").map(l => l.trim()).filter(Boolean);
    const webList = websiteText.split("\n").map(l => l.trim()).filter(Boolean);
    const tweetsList = tweetsText.split("\n").map(t => t.trim()).filter(Boolean);
    const commentsList = commentsText.split("\n").map(c => c.trim()).filter(Boolean);
    
    // Combine tweets and comments into the short-reply "twitter" input list
    const shortReplies = [...tweetsList, ...commentsList];
    const addText = additionalText ? [additionalText] : [];

    try {
      const res = await fetch("/api/persona/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          youtube: ytList,
          website: webList,
          twitter: shortReplies,
          text: addText
        })
      });

      if (res.ok) {
        setCompileStatus(prev => [...prev, "✓ Persona Compiled successfully!"]);
        await loadPersonas();
      } else {
        setCompileStatus(prev => [...prev, "❌ Compilation failed. Check backend console logs."]);
      }
    } catch (err) {
      console.error("Compilation error:", err);
      setCompileStatus(prev => [...prev, "❌ Fetch compiler error."]);
    } finally {
      setCompiling(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedPersona) return;
    const userMsg = chatMessage;
    setChatMessage("");
    setSending(true);

    const userMessageObj: Message = { role: "user", content: userMsg };
    setChatHistory(prev => [...prev, userMessageObj]);

    try {
      const res = await fetch("/api/persona/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaName: selectedPersona.identity.name,
          message: userMsg,
          platform,
          styleStrength,
          detailLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessageObj: Message = {
          role: "assistant",
          content: data.answer,
          debug: data.debug
        };
        setChatHistory(prev => [...prev, assistantMessageObj]);
        setActiveDebugIndex(chatHistory.length + 1);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl flex flex-col gap-4 max-w-sm w-full shadow-2xl">
          <h1 className="text-xl font-bold text-indigo-400 text-center">Persona Console Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password..."
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 font-bold py-2 rounded text-sm transition-all">
              Login to Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Banner */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-indigo-400">
            Persona Pipeline Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Feed raw creator content, compile profile cards, and audit two-pass simulations.
          </p>
        </header>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Section */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <Settings size={16} />
              Persona Dataset Inputs
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold">Persona Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono"
                  placeholder="e.g. Hitesh"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <Youtube size={12} /> YouTube Video Links (one per line)
                </label>
                <textarea
                  value={youtubeText}
                  onChange={(e) => setYoutubeText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[10px] resize-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <Globe size={12} /> Portfolio/Website URLs (one per line)
                </label>
                <textarea
                  value={websiteText}
                  onChange={(e) => setWebsiteText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[10px] resize-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <Twitter size={12} /> Tweets (one per line)
                </label>
                <textarea
                  value={tweetsText}
                  onChange={(e) => setTweetsText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <MessageSquare size={12} /> YouTube Comments (one per line)
                </label>
                <textarea
                  value={commentsText}
                  onChange={(e) => setCommentsText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <FileText size={12} /> Additional text/transcripts chunks
                </label>
                <textarea
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] resize-none font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleCompile}
              disabled={compiling || !name}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-2.5 rounded-lg text-xs mt-2 disabled:opacity-50 transition-all"
            >
              {compiling ? "Running compiler pipeline..." : "Compile Persona"}
            </button>

            {compileStatus.length > 0 && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[9px] text-slate-400 flex flex-col gap-1">
                {compileStatus.map((s, idx) => <div key={idx}>{s}</div>)}
              </div>
            )}
          </div>

          {/* Simulator Panel */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <UserCheck size={16} />
                Creator Chat Simulator
              </h2>
              
              {/* Select Active Persona */}
              <select
                value={selectedPersona?.identity.name || ""}
                onChange={(e) => {
                  const found = personas.find(p => p.identity.name === e.target.value);
                  if (found) setSelectedPersona(found);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-indigo-400 font-mono font-bold"
              >
                {personas.map(p => (
                  <option key={p.identity.name} value={p.identity.name}>{p.identity.name}</option>
                ))}
                {personas.length === 0 && <option>No active card</option>}
              </select>
            </div>

            {/* Config Sliders */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg text-[10px] text-slate-400">
              <div>
                <label className="block mb-1 font-semibold uppercase">Platform Mode</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded p-1 w-full text-slate-300"
                >
                  <option value="youtube">YouTube Comment</option>
                  <option value="twitter">Twitter Reply</option>
                  <option value="live">Live Stream Chat</option>
                  <option value="formal">Formal Lecture</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold uppercase flex justify-between">
                  <span>Style Ratio</span>
                  <span>{styleStrength * 100}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={styleStrength}
                  onChange={(e) => setStyleStrength(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold uppercase">Detail Level</label>
                <select
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded p-1 w-full text-slate-300"
                >
                  <option value="brief">Brief</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 min-h-[220px] bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-y-auto flex flex-col gap-4 max-h-[300px]">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs border ${
                    msg.role === "user" ? "bg-indigo-650/10 border-indigo-500/20 text-indigo-300" : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.debug && (
                    <button
                      onClick={() => setActiveDebugIndex(activeDebugIndex === i ? null : i)}
                      className="mt-1 text-[9px] font-mono text-slate-500 hover:text-indigo-400 flex items-center gap-1"
                    >
                      <Terminal size={10} />
                      {activeDebugIndex === i ? "Hide style audits" : "Audit two-pass planning steps"}
                    </button>
                  )}
                  {msg.role === "assistant" && msg.debug && activeDebugIndex === i && (
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-[8px] font-mono text-slate-400 mt-1.5 w-full flex flex-col gap-2">
                      <div className="border-b border-slate-800 pb-1.5">
                        <span className="text-pink-400 font-bold block">PASS 1: Factual Plan</span>
                        <div>Intent: {msg.debug.pass1_plan.intent}</div>
                        <div>Covering: {msg.debug.pass1_plan.points_to_include.join(", ")}</div>
                      </div>
                      <div className="border-b border-slate-800 pb-1.5 font-sans">
                        <span className="text-indigo-400 font-bold block font-mono">PASS 2: Persona Draft</span>
                        <span>"{msg.debug.pass2_draft}"</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold block">PASS 3: Style Verifier Audit</span>
                        <div>Score: {msg.debug.pass3_verification.score * 100}%</div>
                        <div>Feedback: {msg.debug.pass3_verification.feedback}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sending && <div className="text-slate-500 text-[10px] italic">Simulating active creator...</div>}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask the simulated creator..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !chatMessage.trim() || !selectedPersona}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>

        </div>

        {/* Selected Persona Card Details */}
        {selectedPersona && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-pink-400 flex items-center gap-1.5">
                <Eye size={16} /> Compiled PKP Inspector: {selectedPersona.identity.name}
              </h3>
              <div className="flex bg-slate-950 p-1 rounded-lg text-[9px] font-semibold">
                {["identity", "style", "vocabulary", "examples", "raw"].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`px-3 py-1 rounded capitalize ${activeTab === t ? "bg-slate-800 text-pink-300" : "text-slate-500"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Content display */}
            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-850 min-h-[120px] text-xs">
              {activeTab === "identity" && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-slate-500 block uppercase font-bold text-[9px]">Role</span> {selectedPersona.identity.public_role}</div>
                  <div><span className="text-slate-500 block uppercase font-bold text-[9px]">Audience</span> {selectedPersona.identity.audience}</div>
                  <div className="col-span-2"><span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Teaching Scope</span> {selectedPersona.identity.teaching_scope.join(", ")}</div>
                  <div className="col-span-2"><span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Known For</span> {selectedPersona.identity.known_for.join(", ")}</div>
                </div>
              )}

              {activeTab === "style" && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-slate-500 block uppercase font-bold text-[9px]">Tones</span> {selectedPersona.communication.tone.join(", ")}</div>
                  <div><span className="text-slate-500 block uppercase font-bold text-[9px]">Sentence Rhythm</span> {selectedPersona.communication.sentence_length}</div>
                  <div className="col-span-2"><span className="text-red-400 block uppercase font-bold text-[9px] mb-1">Anti-Style (Things to Avoid)</span> {selectedPersona.anti_style.join("; ")}</div>
                </div>
              )}

              {activeTab === "vocabulary" && (
                <div className="flex flex-col gap-3 font-mono text-[10px]">
                  <div><span className="text-slate-500 block uppercase font-bold text-[9px] font-sans">Phrase Bank</span> {selectedPersona.phrase_bank.join(", ")}</div>
                  <div><span className="text-slate-500 block uppercase font-bold text-[9px] font-sans">Factual Knowledge Nodes</span> {selectedPersona.knowledge.join(", ")}</div>
                </div>
              )}

              {activeTab === "examples" && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto font-mono text-[9px] divide-y divide-slate-850">
                  {selectedPersona.example_replies.map((item, idx) => (
                    <div key={idx} className="pt-2">
                      <div className="text-slate-500 font-bold uppercase">Platform: {item.platform} | Intent: {item.intent}</div>
                      <div>Q: {item.question}</div>
                      <div className="text-indigo-300">A: {item.answer}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "raw" && (
                <pre className="font-mono text-[9px] max-h-48 overflow-y-auto">{JSON.stringify(selectedPersona, null, 2)}</pre>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
