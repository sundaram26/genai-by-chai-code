"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

export function SelfConsistency() {
    const [prompt, setPrompt] = useState("");
    const [models, setModels] = useState<Record<string, boolean>>({
        "gpt-4o-mini": true,
        "claude-3-5-sonnet-20240620": true,
        "gemini-3.5-flash": true
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const toggleModel = (model: string) => {
        setModels(prev => ({ ...prev, [model]: !prev[model] }));
    };

    const handleRun = async () => {
        setError("");
        setResult(null);
        
        const selectedModels = Object.keys(models).filter(m => models[m]);
        if (selectedModels.length === 0) {
            setError("Please select at least one model.");
            return;
        }
        if (!prompt.trim()) {
            setError("Please enter a prompt.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/agent/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt,
                    models: selectedModels
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.message || JSON.stringify(data.errors));
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="fixed inset-0 bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col">
            <div className="mx-auto flex flex-1 min-h-0 w-full max-w-6xl flex-col px-6 pt-12 pb-6">
                <header className="mb-8 flex flex-col gap-6 border-b border-neutral-200 pb-8 shrink-0">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                            Self Consistency
                        </p>
                        <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
                            Evaluate Agent
                        </h1>
                    </div>
                </header>

                <section className="flex min-h-0 flex-1 flex-col md:flex-row gap-6">
                    {/* Left Column: Input Section */}
                    <div className="w-full md:w-1/3 flex flex-col gap-6 shrink-0">
                        <div className="border border-neutral-200 bg-neutral-50 p-6 flex flex-col gap-4 shrink-0">
                            <label className="text-sm font-medium text-neutral-900">Select Models</label>
                            <div className="flex flex-col gap-3">
                                {Object.entries(models).map(([model, isSelected]) => (
                                    <label key={model} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 flex items-center justify-center border transition-colors ${isSelected ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 bg-white group-hover:border-neutral-400'}`}>
                                            {isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleModel(model)} />
                                        <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">{model}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleRun(); }} className="flex flex-col flex-1 gap-4 min-h-0">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Message to evaluate..."
                                className="flex-1 min-h-[150px] border border-neutral-300 bg-white p-5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 resize-none"
                            />
                            {error && (
                                <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center bg-neutral-900 px-6 py-4 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run Evaluation"}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Results Section */}
                    <div className="flex-1 flex flex-col border border-neutral-200 bg-white overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {!result && !loading && (
                                <div className="flex h-full items-center justify-center text-center text-neutral-400 font-light">
                                    Select models, enter a prompt, and run the evaluation to see the majority vote.
                                </div>
                            )}
                            
                            {loading && (
                                <div className="flex flex-col h-full items-center justify-center text-center text-neutral-400 font-light gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                                    Evaluating across models...
                                </div>
                            )}

                            {result && !loading && (
                                <>
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                                            Majority Vote Answer
                                        </h3>
                                        <div className="border border-neutral-200 bg-neutral-900 p-6">
                                            <div className="text-white text-sm leading-relaxed whitespace-pre-wrap font-light">
                                                {result.bestAnswer || <span className="italic text-neutral-400">No distinct text was returned.</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                                            Raw Model Responses
                                        </h3>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {Object.entries(result.rawResponses || {}).map(([model, response]: [string, any]) => (
                                                <div key={model} className="flex flex-col border border-neutral-200 bg-white h-full">
                                                    <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                                                        <span className="font-medium text-xs tracking-wider uppercase text-neutral-600">{model}</span>
                                                    </div>
                                                    <div className="p-5 text-sm text-neutral-800 whitespace-pre-wrap flex-grow font-light">
                                                        {response.text || <span className="italic text-neutral-400">Empty response</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
