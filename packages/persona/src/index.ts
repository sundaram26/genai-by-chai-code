import "dotenv/config"
import * as fs from "fs/promises";
import * as path from "path";
import OpenAI from "openai";

export type PersonaId = "piyush" | "hitesh";

export interface PersonaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamPersonaOptions {
  persona: PersonaId;
  messages: PersonaChatMessage[];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

const PERSONA_FILES: Record<PersonaId, string> = {
  piyush: "Piyush.md",
  hitesh: "Hitesh.md",
};

export const PERSONAS: Array<{ id: PersonaId; label: string }> = [
  { id: "piyush", label: "Piyush Garg" },
  { id: "hitesh", label: "Hitesh Chaudhary" },
];

export function normalizePersona(value: unknown): PersonaId {
  return String(value).toLowerCase() === "piyush" ? "piyush" : "hitesh";
}

export async function loadPersonaPrompt(persona: PersonaId) {
  const fileName = PERSONA_FILES[persona];
  const candidateDirs = [
    path.resolve(__dirname, "../personas"),
    path.resolve(__dirname, "../../personas"),
    path.resolve(process.cwd(), "../../packages/persona/personas"),
    path.resolve(process.cwd(), "packages/persona/personas"),
  ];

  console.log(process.env.OPENAI_API_KEY, "process.env.OPENAI_API_KEY")
  console.log(process.env.OPENAI_BASE_URL, "process.env.OPENAI_BASE_URL")


  for (const dir of candidateDirs) {
    try {
      return await fs.readFile(path.join(dir, fileName), "utf8");
    } catch {
      // Try the next runtime location.
    }
  }

  throw new Error(`Could not load persona prompt: ${fileName}`);
}


export async function streamPersonaResponse(options: StreamPersonaOptions) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }
  

  const baseUrl = process.env.OPENAI_BASE_URL;
  const model = "gpt-4o-mini";

  const systemPrompt = await loadPersonaPrompt(options.persona);
  
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  });

  const MESSAGES_DB = [
    { role: "system", content: systemPrompt },
    ...options.messages,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const responseStream = await client.chat.completions.create({
          model: model,
          stream: true,
          temperature: 0.7,
          messages: MESSAGES_DB as any,
        });
        
        for await (const chunk of responseStream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            const payload = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
            controller.enqueue(encoder.encode(payload));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    }
  });

  return stream;
}
