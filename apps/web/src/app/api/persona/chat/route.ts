import { NextResponse } from "next/server";
import {
  normalizePersona,
  streamPersonaResponse,
  type PersonaChatMessage,
} from "@all-genai-assignments/persona";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const persona = normalizePersona(body.persona);
    const messages = Array.isArray(body.messages)
      ? (body.messages as PersonaChatMessage[])
      : [];

    const stream = await streamPersonaResponse({ persona, messages });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Persona chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream persona response." },
      { status: 500 },
    );
  }
}
