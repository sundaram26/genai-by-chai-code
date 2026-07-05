import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { getProvider } from "@all-genai-assignments/persona";
import { PersonaCard } from "@all-genai-assignments/persona";

export async function POST(req: Request) {
  try {
    const { 
      personaName, 
      message, 
      platform = "youtube", 
      styleStrength = 1.0, 
      detailLevel = "balanced" 
    } = await req.json();

    if (!personaName || !message) {
      return NextResponse.json({ error: "personaName and message are required." }, { status: 400 });
    }

    const personaSlug = personaName.toLowerCase().replace(/\s+/g, "_");
    const finalDir = path.resolve(process.cwd(), "../../packages/persona/data", personaSlug, "final");

    // Load PKP files
    let card: PersonaCard;
    try {
      const content = await fs.readFile(path.join(finalDir, "persona_card.json"), "utf8");
      card = JSON.parse(content) as PersonaCard;
    } catch (err) {
      return NextResponse.json({ error: `Persona "${personaName}" not compiled or found.` }, { status: 404 });
    }

    // Initialize the provider
    let provider;
    try {
      provider = getProvider();
    } catch (err) {
      // Return a simulated mock generation if API key is not configured
      return returnMockResponse(card, message, platform, styleStrength, detailLevel);
    }

    const platformMode = card.platform_modes[platform as keyof typeof card.platform_modes] || card.platform_modes.youtube;

    // --- PASS 1: Internal Answer Planning ---
    const pass1System = `You are a factual answer planner. Outline what factual details and points to include based on the persona's knowledge base.
Return a structured JSON object:
{
  "intent": "the main goal of the response",
  "points_to_include": ["bullet list of factual details"],
  "briefness_level": "brief" | "medium" | "long"
}
Knowledge Base:
${JSON.stringify(card.knowledge)}`;

    const pass1Prompt = `User question: "${message}"\nTarget detail level: ${detailLevel}`;
    
    let planResult: any;
    try {
      planResult = await provider.generateJson<any>({
        systemPrompt: pass1System,
        prompt: pass1Prompt,
        temperature: 0.1
      });
    } catch (err) {
      console.warn("Pass 1 planning LLM call failed, fallback to default plan", err);
      planResult = {
        intent: "Explain coding simplicity",
        points_to_include: [`Address user message: ${message}`],
        briefness_level: detailLevel === "brief" ? "brief" : "medium"
      };
    }

    // --- PASS 2: Persona Rewrite ---
    const pass2System = `You are a persona simulator acting as "${card.identity.name}".
Public Role: ${card.identity.public_role}
Core Style:
- Tone: ${JSON.stringify(card.communication.tone)}
- Sentence rhythm: ${card.communication.sentence_length} sentences
- Humor: ${card.communication.humor_level}
- Directness: ${card.communication.directness}
Phrase Bank (words to use frequently): ${JSON.stringify(card.phrase_bank)}
Anti-Style (Avoid these rules): ${JSON.stringify(card.anti_style)}

Platform Mode [${platform}]:
- Style: ${platformMode.tone}
- Rules: ${JSON.stringify(platformMode.style_rules)}
- Constraints: ${JSON.stringify(platformMode.constraints)}

Here are examples of how you talk:
${JSON.stringify(card.example_replies)}

Instructions: Rewrite the planned answer points into your own voice. Keep the style strength at: ${styleStrength} (1.0 is full slang/filler words, 0.0 is balanced).`;

    const pass2Prompt = `Planned Answer Points: ${JSON.stringify(planResult.points_to_include)}
User Message: "${message}"`;

    const draftText = await provider.generateText({
      systemPrompt: pass2System,
      prompt: pass2Prompt,
      temperature: 0.7
    });

    // --- PASS 3: Style Verifier ---
    const pass3System = `You are a Persona Style Verifier. Audit the drafted text for authenticity to ensure it sounds like the persona and doesn't drift into generic assistant language.
Anti-Style rules to avoid: ${JSON.stringify(card.anti_style)}
Return a structured JSON object:
{
  "authenticity_score": 0.0 to 1.0,
  "over_politeness": true | false,
  "generic_assistant_voice": true | false,
  "feedback": "why it failed",
  "refined_draft": "if the score is below 0.85, output the corrected rewrite matching the persona style, otherwise return the original draft exactly"
}
Draft: "${draftText}"`;

    const pass3Prompt = `Audit the draft. Return the raw JSON containing the refined draft.`;
    
    let verifierResult: any;
    try {
      verifierResult = await provider.generateJson<any>({
        systemPrompt: pass3System,
        prompt: pass3Prompt,
        temperature: 0.1
      });
    } catch (err) {
      console.warn("Pass 3 verifier LLM call failed. Returning draft directly.", err);
      verifierResult = {
        authenticity_score: 0.9,
        refined_draft: draftText
      };
    }

    const finalAnswer = verifierResult.refined_draft || draftText;

    return NextResponse.json({
      success: true,
      answer: finalAnswer,
      debug: {
        pass1_plan: planResult,
        pass2_draft: draftText,
        pass3_verification: {
          score: verifierResult.authenticity_score,
          over_politeness: verifierResult.over_politeness,
          generic_voice: verifierResult.generic_assistant_voice,
          feedback: verifierResult.feedback
        }
      }
    });

  } catch (error: any) {
    console.error("Persona Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate chat response." }, { status: 500 });
  }
}

// Fallback response builder to demonstrate two-pass simulation in the absence of API keys
function returnMockResponse(
  card: PersonaCard,
  message: string,
  platform: string,
  styleStrength: number,
  detailLevel: string
) {
  const lowercaseMsg = message.toLowerCase();
  
  let answer = "";
  let planIntent = "Acknowledge and simplify";
  let planPoints = ["Keep it simple", "Provide direct code example"];
  let feedback = "Mock mode bypass. Output matches Hinglish patterns.";
  
  if (lowercaseMsg.includes("tokenize") || lowercaseMsg.includes("bpe")) {
    planIntent = "Explain BPE mechanisms";
    planPoints = ["Explain UTF-8 conversion", "Explain merge loops", "Avoid complex SDKs"];
    answer = styleStrength > 0.5
      ? "Bro, coding is simple. For tokenization, you just look at the raw bytes and merge the most frequent adjacent pairs. Simple hai! People write huge packages, but it's just a simple while loop. See? Look at our code."
      : "To implement BPE tokenization, convert the text to UTF-8, find the most frequent byte pairs, and recursively merge them into a single token ID until you reach the target vocabulary size.";
  } else if (lowercaseMsg.includes("fail") || lowercaseMsg.includes("architecture")) {
    planIntent = "Prevent overengineering";
    planPoints = ["Detail monorepo packages", "Acknowledge modularity", "Warn about framework hype"];
    answer = styleStrength > 0.5
      ? "See, if you overcomplicate the monorepo, you fail, bro. Just write clean packages and put next.js in apps/web. Simple. Don't worry about complex pipeline builders, simple hai."
      : "Keep the monorepo clean. Separate backend logic into reusable local npm packages and import them into Next.js using workspaces. It is simple and modular.";
  } else {
    answer = styleStrength > 0.5
      ? `Hey guys, welcome back! You are asking about "${message}". Bro, keep it simple. If you think too much about standard templates, you fail. Let's just build it. Simple hai.`
      : `Answering your query on "${message}". We should implement this simple, modular structure to solve it efficiently.`;
  }

  return NextResponse.json({
    success: true,
    answer,
    debug: {
      is_mock: true,
      pass1_plan: {
        intent: planIntent,
        points_to_include: planPoints,
        briefness_level: detailLevel
      },
      pass2_draft: answer,
      pass3_verification: {
        score: 0.95,
        over_politeness: false,
        generic_voice: false,
        feedback
      }
    }
  });
}
