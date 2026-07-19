"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { 
  FileText, 
  Search, 
  Settings, 
  Activity, 
  Info, 
  Database,
  ArrowRight,
  Code,
  Layers,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

interface TokenDetail {
  id: number;
  text: string;
  bytes: number[];
}

interface Metrics {
  charCount: number;
  byteCount: number;
  tokenCount: number;
  compressionRatio: string;
}

interface VocabItem {
  id: number;
  text: string;
  bytes: number[];
}

interface MergeItem {
  id: number;
  pair: string;
  first: number;
  second: number;
}

// Preset examples for the user to try
const PRESETS = [
  {
    name: "Python Code",
    text: `def calculate_bpe(text, num_merges):\n    tokens = list(text.encode("utf-8"))\n    for i in range(num_merges):\n        pairs = get_stats(tokens)\n        best = max(pairs, key=pairs.get)\n        tokens = merge(tokens, best, 256 + i)\n    return tokens`
  },
  {
    name: "Classic Quote",
    text: "The quick brown fox jumps over the lazy dog. A quick movement, and the fox was gone. BPE tokenization splits words into sub-word pieces based on frequency!"
  },
  {
    name: "Unicode & Emojis",
    text: "AI is reshaping the world! 🚀 Deep Learning 🧠 + Large Language Models 📚 = Endless possibilities 🌟. Unicode characters like Chinese (人工智能), Japanese (人工知能), and Arabic (الذكاء الاصطناعي) work flawlessly."
  },
  {
    name: "Repetitive Patterns",
    text: "banana-nanana-bananarama-ananab-nananana-banana-nanana-banana"
  }
];

// Aesthetic token color themes (pastel / sleek)
const TOKEN_COLORS = [
  { bg: "bg-red-100 dark:bg-red-950/40", border: "border-red-200 dark:border-red-900/60", text: "text-red-800 dark:text-red-300" },
  { bg: "bg-orange-100 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-900/60", text: "text-orange-800 dark:text-orange-300" },
  { bg: "bg-yellow-100 dark:bg-yellow-950/40", border: "border-yellow-200 dark:border-yellow-900/60", text: "text-yellow-800 dark:text-yellow-300" },
  { bg: "bg-green-100 dark:bg-green-950/40", border: "border-green-200 dark:border-green-900/60", text: "text-green-800 dark:text-green-300" },
  { bg: "bg-teal-100 dark:bg-teal-950/40", border: "border-teal-200 dark:border-teal-900/60", text: "text-teal-800 dark:text-teal-300" },
  { bg: "bg-blue-100 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-900/60", text: "text-blue-800 dark:text-blue-300" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-900/60", text: "text-indigo-800 dark:text-indigo-300" },
  { bg: "bg-purple-100 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900/60", text: "text-purple-800 dark:text-purple-300" },
  { bg: "bg-pink-100 dark:bg-pink-950/40", border: "border-pink-200 dark:border-pink-900/60", text: "text-pink-800 dark:text-pink-300" }
];

export default function TokenizerPlayground() {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [tokens, setTokens] = useState<number[]>([]);
  const [tokenDetails, setTokenDetails] = useState<TokenDetail[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    charCount: 0,
    byteCount: 0,
    tokenCount: 0,
    compressionRatio: "1.00"
  });
  const [loading, setLoading] = useState(false);

  // Vocabulary & Merges data
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [merges, setMerges] = useState<MergeItem[]>([]);
  const [vocabSearch, setVocabSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"playground" | "vocab" | "merges">("playground");
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Filter vocab items based on search query
  const filteredVocab = useMemo(() => {
    return vocab.filter(item => {
      if (!vocabSearch) return true;
      const query = vocabSearch.toLowerCase();
      return (
        item.id.toString().includes(query) ||
        item.text.toLowerCase().includes(query) ||
        JSON.stringify(item.bytes).includes(query)
      );
    });
  }, [vocab, vocabSearch]);

  const vocabParentRef = useRef<HTMLDivElement>(null);
  const vocabVirtualizer = useVirtualizer({
    count: filteredVocab.length,
    getScrollElement: () => vocabParentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const mergesParentRef = useRef<HTMLDivElement>(null);
  const mergesVirtualizer = useVirtualizer({
    count: merges.length,
    getScrollElement: () => mergesParentRef.current,
    estimateSize: () => 70,
    overscan: 5,
  });

  // Fetch vocabulary & merges once on mount
  useEffect(() => {
    async function loadVocabData() {
      try {
        const res = await fetch("/api/vocab");
        if (res.ok) {
          const data = await res.json();
          setVocab(data.vocab || []);
          setMerges(data.merges || []);
        }
      } catch (err) {
        console.error("Failed to load vocabulary data:", err);
      }
    }
    loadVocabData();
  }, []);

  // Debounced tokenization
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!inputText) {
        setTokens([]);
        setTokenDetails([]);
        setMetrics({
          charCount: 0,
          byteCount: 0,
          tokenCount: 0,
          compressionRatio: "0.00"
        });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/tokenize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: inputText })
        });
        if (res.ok) {
          const data = await res.json();
          setTokens(data.tokens || []);
          setTokenDetails(data.tokenDetails || []);
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Tokenization error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [inputText]);

  // Format token text for rendering safely
  const formatTokenText = (text: string) => {
    if (text === " ") return "·"; // visible spaces
    if (text === "\n") return "↵\n"; // visible newlines
    if (text === "\t") return "⇥\t"; // visible tabs
    return text;
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getHoveredTokenDetail = () => {
    if (hoveredTokenIndex === null || hoveredTokenIndex >= tokenDetails.length) return null;
    return tokenDetails[hoveredTokenIndex];
  };

  const hoveredDetail = getHoveredTokenDetail();

  return (
    <main className="fixed inset-0 bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col">

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 flex flex-col min-h-0 w-full pb-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-neutral-200 pb-6 mb-6 gap-6 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                BPE Visualizer
              </span>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-neutral-900">
              Byte Pair Encoding Playground
            </h1>
            <p className="text-sm font-light text-neutral-500 mt-2 max-w-lg">
              Explore how sub-word tokens are learned, split, and reconstituted by neural network tokenizers.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-200 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("playground")}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === "playground"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <Activity size={16} />
              Playground
            </button>
            <button
              onClick={() => setActiveTab("vocab")}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === "vocab"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <Database size={16} />
              Vocabulary ({vocab.length})
            </button>
            <button
              onClick={() => setActiveTab("merges")}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === "merges"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <Layers size={16} />
              BPE Merges ({merges.length})
            </button>
          </div>
        </header>

        {activeTab === "playground" && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
            
            {/* Input Column */}
            <div className="lg:w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
              <div className="bg-white border border-neutral-200 p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900">
                    <FileText size={18} className="text-neutral-500" />
                    Input Corpus / Text
                  </h2>
                  <div className="flex gap-2">
                    {loading && (
                      <span className="text-xs text-slate-400 animate-pulse">
                        Tokenizing...
                      </span>
                    )}
                  </div>
                </div>

                {/* Preset Selector */}
                <div className="mb-6">
                  <label className="text-xs text-neutral-400 block mb-2 font-medium uppercase tracking-wider">
                    Load Example
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setInputText(preset.text)}
                        className={`text-xs px-3 py-1.5 border transition-colors ${
                          inputText === preset.text
                            ? "bg-neutral-900 border-neutral-900 text-white font-medium"
                            : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Area */}
                <div className="relative flex-1 min-h-[300px] flex flex-col">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to tokenize..."
                    className="w-full flex-1 p-5 border border-neutral-200 bg-neutral-50 text-sm font-mono focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Visualizer Column */}
            <div className="lg:w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
              
              {/* Metrics cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-neutral-200 p-4 text-center">
                  <div className="text-xs text-neutral-400 mb-1 uppercase tracking-widest font-medium">Tokens</div>
                  <div className="text-xl font-light text-neutral-900">
                    {metrics.tokenCount}
                  </div>
                </div>
                <div className="bg-white border border-neutral-200 p-4 text-center">
                  <div className="text-xs text-neutral-400 mb-1 uppercase tracking-widest font-medium">Characters</div>
                  <div className="text-xl font-light text-neutral-900">
                    {metrics.charCount}
                  </div>
                </div>
                <div className="bg-white border border-neutral-200 p-4 text-center">
                  <div className="text-xs text-neutral-400 mb-1 uppercase tracking-widest font-medium">Bytes</div>
                  <div className="text-xl font-light text-neutral-900">
                    {metrics.byteCount}
                  </div>
                </div>
                <div className="bg-white border border-neutral-200 p-4 text-center">
                  <div className="text-xs text-neutral-400 mb-1 uppercase tracking-widest font-medium">Compression</div>
                  <div className="text-xl font-light text-neutral-900">
                    {metrics.compressionRatio}x
                  </div>
                </div>
              </div>

              {/* Tokenized Output */}
              <div className="bg-white border border-neutral-200 p-6 flex flex-col flex-1">
                <h2 className="text-base font-bold flex items-center gap-2 mb-6 text-neutral-900">
                  <Layers size={18} className="text-neutral-500" />
                  Tokenized Highlights
                </h2>

                <div className="flex-1 min-h-[200px] border border-neutral-200 bg-neutral-50 p-5 overflow-y-auto leading-relaxed text-sm">
                  {tokenDetails.length === 0 ? (
                    <span className="text-neutral-400 font-light">Token highlights will be displayed here as you type...</span>
                  ) : (
                    <div className="flex flex-wrap content-start items-center gap-x-0.5 gap-y-1.5">
                      {tokenDetails.map((token, idx) => {
                        const theme = TOKEN_COLORS[idx % TOKEN_COLORS.length];
                        const isHovered = hoveredTokenIndex === idx;
                        return (
                          <span
                            key={idx}
                            onMouseEnter={() => setHoveredTokenIndex(idx)}
                            onMouseLeave={() => setHoveredTokenIndex(null)}
                            className={`px-1 py-0.5 cursor-pointer border transition-all ${theme.bg} ${theme.border} ${theme.text} ${
                              isHovered 
                                ? "shadow-sm border-neutral-900" 
                                : ""
                            }`}
                          >
                            <code className="whitespace-pre-wrap">{formatTokenText(token.text)}</code>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Token Inspector Panel */}
              <div className="bg-white border border-neutral-200 p-6 min-h-[140px] flex flex-col justify-center">
                {hoveredDetail ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                      <Settings size={14} />
                      Token Inspector
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">Token ID</span>
                        <span className="text-xl font-light font-mono text-neutral-900">
                          {hoveredDetail.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">Decoded Text</span>
                        <span className="text-sm font-medium font-mono bg-neutral-100 px-2 py-1 inline-block max-w-full overflow-hidden text-ellipsis border border-neutral-200">
                          {hoveredDetail.text ? JSON.stringify(hoveredDetail.text) : "[Split byte sequence]"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">UTF-8 Bytes</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hoveredDetail.bytes.map((byte, i) => (
                            <span 
                              key={i} 
                              className="text-xs font-mono px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-200"
                            >
                              {byte}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 py-4 flex flex-col items-center gap-2">
                    <Info size={20} className="text-neutral-300" />
                    <span className="text-sm font-light">Hover over any token block above to inspect its ID and byte representation.</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {activeTab === "vocab" && (
          <div className="bg-white border border-neutral-200 p-6 flex flex-col flex-1 min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-light flex items-center gap-3 text-neutral-900">
                  <Database size={24} className="text-neutral-500" />
                  Vocabulary Database
                </h2>
                <p className="text-sm text-neutral-500 mt-2 font-light max-w-md">
                  Displays the trained BPE dictionary mapping Token IDs to raw sub-word byte patterns.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative max-w-sm w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by ID, string, or bytes..."
                  value={vocabSearch}
                  onChange={(e) => {
                    setVocabSearch(e.target.value);
                  }}
                  className="w-full pl-11 pr-4 py-3 border border-neutral-300 bg-neutral-50 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            {/* Vocab Table Header */}
            <div className="flex border border-neutral-200 bg-neutral-50 text-neutral-400 font-medium text-xs uppercase tracking-widest p-3">
              <div className="w-28">Token ID</div>
              <div className="flex-1">Decoded String</div>
              <div className="flex-1">Underlying Bytes</div>
              <div className="w-16">Copy</div>
            </div>

            {/* Vocab Virtualized List */}
            <div ref={vocabParentRef} className="flex-1 overflow-auto border-x border-b border-neutral-200 bg-white min-h-0 relative">
              <div
                style={{
                  height: `${vocabVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {vocabVirtualizer.getVirtualItems().map((virtualItem) => {
                  const item = filteredVocab[virtualItem.index];
                  return (
                    <div
                      key={item.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="flex items-center p-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors text-sm font-mono"
                    >
                      <div className="w-28 font-medium text-neutral-900">{item.id}</div>
                      <div className="flex-1">
                        <span className="bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-neutral-800 text-xs font-medium">
                          {JSON.stringify(item.text)}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1">
                        {item.bytes.map((byte, i) => (
                          <span 
                            key={i} 
                            className="text-[10px] px-1 bg-white border border-neutral-200 text-neutral-500"
                          >
                            {byte}
                          </span>
                        ))}
                      </div>
                      <div className="w-16">
                        <button
                          onClick={() => copyToClipboard(item.text, item.id)}
                          className="p-1 hover:bg-neutral-200 transition-all text-neutral-400 hover:text-neutral-900"
                        >
                          {copiedIndex === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredVocab.length === 0 && (
                <div className="p-8 text-center text-neutral-400 font-light">
                  No vocabulary items match your search.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "merges" && (
          <div className="bg-white border border-neutral-200 p-6 flex flex-col flex-1 min-h-0">
            <div className="mb-6 shrink-0">
              <h2 className="text-2xl font-light flex items-center gap-3 text-neutral-900">
                <Layers size={24} className="text-neutral-500" />
                BPE Merge Rules
              </h2>
              <p className="text-sm text-neutral-500 mt-2 font-light max-w-lg">
                Displays the sequence of merging rules trained on the text corpus. In BPE, the most frequent pairs of adjacent bytes are recursively merged into new tokens.
              </p>
            </div>

            {/* Merges Virtualized List */}
            <div ref={mergesParentRef} className="flex-1 overflow-auto border border-neutral-200 bg-white min-h-0 relative">
              <div
                style={{
                  height: `${mergesVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {mergesVirtualizer.getVirtualItems().map((virtualItem) => {
                  const index = virtualItem.index;
                  const item = merges[index];
                  return (
                    <div
                      key={item.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-neutral-50 transition-colors font-mono gap-4"
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] text-neutral-400 font-medium tracking-widest uppercase w-20">
                          MERGE #{index + 1}
                        </span>
                        <span className="text-xs text-neutral-900 font-bold bg-neutral-100 border border-neutral-200 px-2 py-1">
                          ID: {item.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 font-medium text-neutral-700 text-sm">
                        <div className="px-3 py-1.5 bg-white border border-neutral-200 flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 font-light uppercase tracking-widest">A</span>
                          <span>{item.pair.split("-")[0]}</span>
                        </div>
                        <ArrowRight size={14} className="text-neutral-400 shrink-0" />
                        <div className="px-3 py-1.5 bg-white border border-neutral-200 flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 font-light uppercase tracking-widest">B</span>
                          <span>{item.pair.split("-")[1]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {merges.length === 0 && (
                <div className="text-center text-neutral-400 py-12 text-sm font-light flex items-center justify-center h-full w-full">
                  No merge rules loaded. Try running a training step on your BPE tokenizer!
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}