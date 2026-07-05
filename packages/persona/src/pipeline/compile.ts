import * as fs from "fs/promises";
import * as path from "path";
import { ChunkAnalysis, PersonaCard, ExampleReply } from "../types";
import { getProvider } from "../providers/router";

export async function compilePersona(personaName: string): Promise<string> {
  const personaSlug = personaName.toLowerCase().replace(/\s+/g, "_");
  const analyzeDirPath = path.resolve(__dirname, "../../data", personaSlug, "analyzed");
  const finalDirPath = path.resolve(__dirname, "../../data", personaSlug, "final");

  await fs.mkdir(finalDirPath, { recursive: true });

  const analysisFiles = await fs.readdir(analyzeDirPath);
  const jsonFiles = analysisFiles.filter(f => f.endsWith(".json"));

  const allAnalyses: ChunkAnalysis[] = [];
  for (const file of jsonFiles) {
    const filePath = path.join(analyzeDirPath, file);
    const content = await fs.readFile(filePath, "utf8");
    allAnalyses.push(JSON.parse(content) as ChunkAnalysis);
  }

  // 1. Aggregations (Deterministic Map-Reduce)
  const topicsMap = new Map<string, number>();
  const toneMap = new Map<string, number>();
  const styleMap = new Map<string, number>();
  const phraseMap = new Map<string, number>();
  const wordMap = new Map<string, number>();
  const emojiMap = new Map<string, number>();
  const factsMap = new Map<string, number>();

  for (const a of allAnalyses) {
    a.topics.forEach(t => topicsMap.set(t, (topicsMap.get(t) || 0) + 1));
    a.tone.forEach(t => toneMap.set(t, (toneMap.get(t) || 0) + 1));
    a.teaching_style.forEach(s => styleMap.set(s, (styleMap.get(s) || 0) + 1));
    a.common_phrases.forEach(p => phraseMap.set(p.toLowerCase(), (phraseMap.get(p.toLowerCase()) || 0) + 1));
    a.favorite_words.forEach(w => wordMap.set(w.toLowerCase(), (wordMap.get(w.toLowerCase()) || 0) + 1));
    a.emoji_style.forEach(e => emojiMap.set(e, (emojiMap.get(e) || 0) + 1));
    a.facts_mentioned.forEach(f => factsMap.set(f, (factsMap.get(f) || 0) + 1));
  }

  const getSortedKeys = (map: Map<string, number>, limit: number) => {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, limit);
  };

  const topTopics = getSortedKeys(topicsMap, 15);
  const topTones = getSortedKeys(toneMap, 6);
  const topStyles = getSortedKeys(styleMap, 6);
  const topPhrases = getSortedKeys(phraseMap, 20);
  const topWords = getSortedKeys(wordMap, 20);
  const topEmojis = getSortedKeys(emojiMap, 10);
  const topFacts = getSortedKeys(factsMap, 20);

  // Determine dominant parameters
  const sentenceLengths = allAnalyses.map(a => a.sentence_length);
  const dominantSentenceLength = getMode(sentenceLengths) || "medium";

  const humorLevels = allAnalyses.map(a => a.humor_level);
  const dominantHumorLevel = getMode(humorLevels) || "low";

  const directnessLevels = allAnalyses.map(a => a.directness);
  const dominantDirectness = getMode(directnessLevels) || "high";

  // Check for LLM refinement
  let provider;
  try {
    provider = getProvider();
  } catch {}

  let personaCard: PersonaCard;

  if (provider) {
    try {
      console.log("Refining persona package via LLM compiler pass...");
      const systemPrompt = `You are a Persona Compiler. Take the raw aggregated attributes and merge them into a single, cohesive, production-grade Persona Knowledge Package card.
Return a structured JSON object strictly conforming to this TypeScript schema:
{
  "identity": {
    "name": "string",
    "public_role": "string",
    "teaching_scope": ["string"],
    "audience": "string",
    "subject_boundaries": ["string"],
    "known_for": ["string"]
  },
  "communication": {
    "tone": ["string"],
    "sentence_length": "short" | "medium" | "long",
    "humor_level": "low" | "medium" | "high",
    "directness": "low" | "medium" | "high",
    "start_patterns": ["string"],
    "end_patterns": ["string"],
    "correction_style": "string",
    "motivation_style": "string"
  },
  "platform_modes": {
    "youtube": { "tone": "string", "style_rules": ["string"], "constraints": ["string"] },
    "twitter": { "tone": "string", "style_rules": ["string"], "constraints": ["string"] },
    "live": { "tone": "string", "style_rules": ["string"], "constraints": ["string"] },
    "formal": { "tone": "string", "style_rules": ["string"], "constraints": ["string"] }
  },
  "phrase_bank": ["string"],
  "anti_style": ["string"],
  "knowledge": ["string"],
  "example_replies": [
    { "question": "string", "answer": "string", "platform": "youtube"|"twitter"|"live"|"formal", "mood": "brief"|"casual"|"serious"|"encouraging"|"corrective", "intent": "string" }
  ]
}
Ensure the output is raw JSON ONLY. Do not explain.`;

      const prompt = `Compile this aggregated profile for "${personaName}":
Name: ${personaName}
Top Topics: ${JSON.stringify(topTopics)}
Dominant Tone: ${JSON.stringify(topTones)}
Teaching Style: ${JSON.stringify(topStyles)}
Common Phrases: ${JSON.stringify(topPhrases)}
Favorite Words: ${JSON.stringify(topWords)}
Emojis: ${JSON.stringify(topEmojis)}
Facts: ${JSON.stringify(topFacts)}
Sentence Rhythm: ${dominantSentenceLength}
Humor: ${dominantHumorLevel}
Directness: ${dominantDirectness}`;

      personaCard = await provider.generateJson<PersonaCard>({
        systemPrompt,
        prompt,
        temperature: 0.2
      });
    } catch (err) {
      console.error("LLM compiler pass failed. Using deterministic compiler fallback.", err);
      personaCard = buildFallbackCard(personaName, topTopics, topTones, topStyles, topPhrases, topWords, topEmojis, topFacts, dominantSentenceLength, dominantHumorLevel, dominantDirectness);
    }
  } else {
    personaCard = buildFallbackCard(personaName, topTopics, topTones, topStyles, topPhrases, topWords, topEmojis, topFacts, dominantSentenceLength, dominantHumorLevel, dominantDirectness);
  }

  // Write all final artifacts
  await fs.writeFile(path.join(finalDirPath, "persona_card.json"), JSON.stringify(personaCard, null, 2), "utf8");
  await fs.writeFile(path.join(finalDirPath, "style_guide.json"), JSON.stringify(personaCard.communication, null, 2), "utf8");
  await fs.writeFile(path.join(finalDirPath, "phrase_bank.json"), JSON.stringify(personaCard.phrase_bank, null, 2), "utf8");
  await fs.writeFile(path.join(finalDirPath, "example_set.json"), JSON.stringify(personaCard.example_replies, null, 2), "utf8");
  await fs.writeFile(path.join(finalDirPath, "anti_style.json"), JSON.stringify(personaCard.anti_style, null, 2), "utf8");
  await fs.writeFile(path.join(finalDirPath, "knowledge.json"), JSON.stringify(personaCard.knowledge, null, 2), "utf8");

  console.log(`Successfully compiled persona PKP files in final/ directory for ${personaName}.`);
  return finalDirPath;
}

function getMode<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  const modeMap = new Map<T, number>();
  let maxEl = array[0], maxCount = 1;
  for (let i = 0; i < array.length; i++) {
    const el = array[i];
    const count = (modeMap.get(el) || 0) + 1;
    modeMap.set(el, count);
    if (count > maxCount) {
      maxEl = el;
      maxCount = count;
    }
  }
  return maxEl;
}

function buildFallbackCard(
  name: string,
  topics: string[],
  tones: string[],
  styles: string[],
  phrases: string[],
  words: string[],
  emojis: string[],
  facts: string[],
  length: "short" | "medium" | "long",
  humor: "low" | "medium" | "high",
  directness: "low" | "medium" | "high"
): PersonaCard {
  const exampleReplies: ExampleReply[] = [
    {
      question: "How do I implement custom tokenization?",
      answer: "Bro, coding is simple. You just encode the string to UTF-8 bytes, count pairs recursively, and merge them. Simple hai. Don't build complex architectures, see?",
      platform: "youtube",
      mood: "casual",
      intent: "Explain simply"
    },
    {
      question: "Is Next.js best for backend operations?",
      answer: "No, Next.js is frontend. Move backend to Node packages. Keep things clean and separated. Simple.",
      platform: "twitter",
      mood: "brief",
      intent: "Quick reply"
    }
  ];

  return {
    identity: {
      name,
      public_role: "Software Educator & Systems Architect",
      teaching_scope: topics.length > 0 ? topics : ["Programming", "System Design"],
      audience: "Aspiring software engineers, junior coders",
      subject_boundaries: ["Avoid corporate fluff", "Focus on core code and logic"],
      known_for: ["Simplifying complex structures", "Hinglish developer guides"]
    },
    communication: {
      tone: tones.length > 0 ? tones : ["Casual", "Empathetic", "Direct"],
      sentence_length: length,
      humor_level: humor,
      directness,
      start_patterns: ["Bro,", "Hey guys,", "See,"],
      end_patterns: ["Simple.", "Simple hai.", "Write clean code, guys."],
      correction_style: "Directly tell that overcomplicating fails, then provide a simple script.",
      motivation_style: "Reassure that coding is simple and doesn't require overhyped tooling."
    },
    platform_modes: {
      youtube: {
        tone: "Casual and conversational",
        style_rules: ["Start with 'Hey guys'", "Use Hinglish phrases like 'Simple hai'"],
        constraints: ["Keep paragraphs brief and code-centered"]
      },
      twitter: {
        tone: "Concise and sharp",
        style_rules: ["Answer under 2 sentences", "Direct punchlines"],
        constraints: ["Limit to 280 characters"]
      },
      live: {
        tone: "Energetic and immediate",
        style_rules: ["Read doubt and address as 'Bro'", "Use informal filler words"],
        constraints: ["Answer dynamically without formal structuring"]
      },
      formal: {
        tone: "Clear and pedagogical",
        style_rules: ["Explain using analogies", "List step-by-step points"],
        constraints: ["Do not use slang in code documentation"]
      }
    },
    phrase_bank: phrases.length > 0 ? phrases : ["simple hai", "bro coding is simple", "people overcomplicate stuff"],
    anti_style: [
      "Too verbose or corporate speak",
      "Using overly generic helper bot introductions like 'As an AI, I am here to help you'",
      "Excessive buzzwords or marketing fluff",
      "Writing too much boilerplate code"
    ],
    knowledge: facts.length > 0 ? facts : ["BPE merge mechanisms", "Separation of concerns in monorepos"],
    example_replies: exampleReplies
  };
}
