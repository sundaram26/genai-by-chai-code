import * as fs from "fs/promises";
import * as path from "path";
import { CleanedChunk } from "./clean";
import { ChunkAnalysis } from "../types";
import { getProvider } from "../providers/router";

export async function analyzeChunks(personaName: string): Promise<string> {
  const personaSlug = personaName.toLowerCase().replace(/\s+/g, "_");
  const cleanDirPath = path.resolve(__dirname, "../../data", personaSlug, "cleaned");
  const analyzeDirPath = path.resolve(__dirname, "../../data", personaSlug, "analyzed");
  
  await fs.mkdir(analyzeDirPath, { recursive: true });

  const chunkFiles = await fs.readdir(cleanDirPath);
  const jsonFiles = chunkFiles.filter(f => f.endsWith(".json"));

  console.log(`Analyzing ${jsonFiles.length} chunks via LLM...`);

  // Try to load LLM provider
  let provider;
  try {
    provider = getProvider();
    console.log(`Using LLM Provider: ${provider.name}`);
  } catch (err) {
    console.warn("LLM API Key missing or provider unavailable. Running in pipeline fallback/mock mode.");
  }

  const systemPrompt = `You are a Persona Style Extractor. Analyze the provided text chunk and extract all structural, vocabulary, and stylistic markers to help reconstruct the author's persona.
If the text contains Hindi (Devnagari) script, transliterate any extracted phrases, quotes, or examples into Romanized Hinglish (e.g. "hello, aap log kaise ho?"). DO NOT output any Devnagari script in the final JSON.
Return a structured JSON object strictly conforming to this TypeScript schema:
{
  "topics": ["string"],
  "teaching_style": ["string"],
  "tone": ["string"],
  "sentence_length": "short" | "medium" | "long",
  "humor_level": "low" | "medium" | "high",
  "directness": "low" | "medium" | "high",
  "common_phrases": ["string"],
  "favorite_words": ["string"],
  "emoji_style": ["string"],
  "example_analogies": ["string"],
  "answer_patterns": ["string"],
  "correction_style": ["string"],
  "motivation_style": ["string"],
  "platform_style": {
    "youtube_comment": {},
    "twitter_reply": {},
    "live_chat": {}
  },
  "facts_mentioned": ["string"],
  "confidence": 0.95
}
Ensure the output is raw JSON ONLY. Do not explain.`;

  for (const file of jsonFiles) {
    const filePath = path.join(cleanDirPath, file);
    const content = await fs.readFile(filePath, "utf8");
    const chunk = JSON.parse(content) as CleanedChunk;

    let analysis: ChunkAnalysis;

    if (provider) {
      try {
        const prompt = `Analyze this text chunk from author "${personaName}" on platform "${chunk.platform}":\n\n"${chunk.text}"`;
        analysis = await provider.generateJson<ChunkAnalysis>({
          systemPrompt,
          prompt,
          temperature: 0.1
        });
      } catch (err) {
        console.error(`LLM call failed for chunk ${chunk.chunkId}. Falling back to heuristic analysis.`, err);
        analysis = generateMockAnalysis(chunk.text, personaName);
      }
    } else {
      analysis = generateMockAnalysis(chunk.text, personaName);
    }

    const outPath = path.join(analyzeDirPath, `${chunk.chunkId}_analysis.json`);
    await fs.writeFile(outPath, JSON.stringify(analysis, null, 2), "utf8");
  }

  return analyzeDirPath;
}

// Heuristic fallback to analyze text style markers in the absence of API keys
function generateMockAnalysis(text: string, name: string): ChunkAnalysis {
  const lowercase = text.toLowerCase();
  
  // Scrape style markers using simple heuristics
  const commonPhrases: string[] = [];
  const favoriteWords: string[] = [];

  const markers = [
    { word: "bro", phrase: "bro coding is simple" },
    { word: "simple hai", phrase: "simple hai" },
    { word: "see", phrase: "see? Look at this" },
    { word: "fail", phrase: "you fail if you overcomplicate" },
    { word: "guys", phrase: "guys, see this" }
  ];

  for (const m of markers) {
    if (lowercase.includes(m.word)) {
      favoriteWords.push(m.word);
      commonPhrases.push(m.phrase);
    }
  }

  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  const wordCount = text.split(/\s+/).length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 15;

  return {
    topics: ["BPE Tokenization", "Coding simplicity", "DSA and systems architecture"],
    teaching_style: ["Hands-on coding demonstrations", "Anti-boilerplate examples"],
    tone: lowercase.includes("bro") ? ["Casual", "Empathetic", "Direct", "Energetic"] : ["Informative", "Clear"],
    sentence_length: avgSentenceLength < 10 ? "short" : avgSentenceLength < 20 ? "medium" : "long",
    humor_level: lowercase.includes("fail") || lowercase.includes("bro") ? "medium" : "low",
    directness: "high",
    common_phrases: commonPhrases.length > 0 ? commonPhrases : ["simple hai", "bro coding"],
    favorite_words: favoriteWords.length > 0 ? favoriteWords : ["simple", "bro", "guys"],
    emoji_style: text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji}/gu) || ["🚀", "🧠"],
    example_analogies: ["Comparing BPE merge steps to basic list folding"],
    answer_patterns: ["Starting with validation", "Direct example demonstrations"],
    correction_style: ["Direct, explaining why overcomplicating fails"],
    motivation_style: ["Empathetic and practical, encouraging writing simple logic"],
    platform_style: {
      youtube_comment: { tone: "casual", greeting: "Hey guys" },
      twitter_reply: { tone: "brief", limit: 280 }
    },
    facts_mentioned: ["BPE vocab targets", "UTF-8 bytes boundaries"],
    confidence: 0.8
  };
}
