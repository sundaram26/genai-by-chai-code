"use client";

import React, { useState, useEffect, useRef } from "react";
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

  // Filter vocab items based on search query
  const filteredVocab = vocab.filter(item => {
    if (!vocabSearch) return true;
    const query = vocabSearch.toLowerCase();
    return (
      item.id.toString().includes(query) ||
      item.text.toLowerCase().includes(query) ||
      JSON.stringify(item.bytes).includes(query)
    );
  });

  const getHoveredTokenDetail = () => {
    if (hoveredTokenIndex === null || hoveredTokenIndex >= tokenDetails.length) return null;
    return tokenDetails[hoveredTokenIndex];
  };

  const hoveredDetail = getHoveredTokenDetail();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                BPE Visualizer
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Byte Pair Encoding Playground
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore how sub-word tokens are learned, split, and reconstituted by neural network tokenizers.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm self-start md:self-auto">
            <button
              onClick={() => setActiveTab("playground")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "playground"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Activity size={14} />
              Playground
            </button>
            <button
              onClick={() => setActiveTab("vocab")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "vocab"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Database size={14} />
              Vocabulary ({vocab.length})
            </button>
            <button
              onClick={() => setActiveTab("merges")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "merges"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Layers size={14} />
              BPE Merges ({merges.length})
            </button>
          </div>
        </header>

        {activeTab === "playground" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Input Column */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <FileText size={18} className="text-indigo-500" />
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
                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                    Or select a preloaded sample:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setInputText(preset.text)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          inputText === preset.text
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
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
                    className="w-full flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Visualizer Column */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Metrics cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Tokens</div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {metrics.tokenCount}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Characters</div>
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {metrics.charCount}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Bytes</div>
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {metrics.byteCount}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Compression</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.compressionRatio}x
                  </div>
                </div>
              </div>

              {/* Tokenized Output */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col flex-1">
                <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                  <Layers size={18} className="text-indigo-500" />
                  Tokenized Highlights
                </h2>

                <div className="flex-1 min-h-[200px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl p-4 overflow-y-auto leading-relaxed text-sm">
                  {tokenDetails.length === 0 ? (
                    <span className="text-slate-400 italic">Token highlights will be displayed here as you type...</span>
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
                            className={`px-1 py-0.5 rounded cursor-pointer border transition-all ${theme.bg} ${theme.border} ${theme.text} ${
                              isHovered 
                                ? "scale-105 shadow-md ring-2 ring-indigo-500/30" 
                                : "hover:scale-105"
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
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm min-h-[140px] flex flex-col justify-center">
                {hoveredDetail ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2 flex items-center gap-1.5">
                      <Settings size={12} />
                      Token Inspector
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-slate-400 block">Token ID</span>
                        <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {hoveredDetail.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Decoded Text</span>
                        <span className="text-sm font-semibold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block max-w-full overflow-hidden text-ellipsis">
                          {hoveredDetail.text ? JSON.stringify(hoveredDetail.text) : "[Split byte sequence]"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">UTF-8 Bytes</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {hoveredDetail.bytes.map((byte, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                            >
                              {byte}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-4 flex flex-col items-center gap-1">
                    <Info size={20} className="text-slate-300 dark:text-slate-700" />
                    <span className="text-xs">Hover over any token block above to inspect its ID and byte representation.</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {activeTab === "vocab" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Database size={20} className="text-indigo-500" />
                  Vocabulary Database
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Displays the trained BPE dictionary mapping Token IDs to raw sub-word byte patterns.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative max-w-sm w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, string, or bytes..."
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Vocab Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3 w-28">Token ID</th>
                    <th className="p-3">Decoded String</th>
                    <th className="p-3">Underlying Bytes</th>
                    <th className="p-3 w-16">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredVocab.slice(0, 100).map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">
                        {item.id}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 text-xs font-semibold">
                          {JSON.stringify(item.text)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.bytes.map((byte, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] px-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-500"
                            >
                              {byte}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => copyToClipboard(item.text, item.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          {copiedIndex === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredVocab.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                        No vocabulary items match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredVocab.length > 100 && (
              <div className="text-center text-slate-400 mt-4 text-xs italic">
                Showing first 100 of {filteredVocab.length} matching vocabulary items.
              </div>
            )}
          </div>
        )}

        {activeTab === "merges" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers size={20} className="text-indigo-500" />
                BPE Merge Rules
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays the sequence of merging rules trained on the text corpus. In BPE, the most frequent pairs of adjacent bytes are recursively merged into new tokens.
              </p>
            </div>

            {/* Merges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {merges.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs flex flex-col justify-between hover:border-indigo-500/55 dark:hover:border-indigo-500/50 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wider">
                      MERGE #{index + 1}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                      ID: {item.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-1 font-semibold text-slate-700 dark:text-slate-350">
                    <div className="text-center px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded flex-1">
                      <div className="text-[10px] text-slate-400 mb-0.5 font-normal">Token A</div>
                      <span>{item.pair.split("-")[0]}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-400" />
                    <div className="text-center px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded flex-1">
                      <div className="text-[10px] text-slate-400 mb-0.5 font-normal">Token B</div>
                      <span>{item.pair.split("-")[1]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {merges.length === 0 && (
              <div className="text-center text-slate-400 py-12 italic text-xs">
                No merge rules loaded. Try running a training step on your BPE tokenizer!
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}