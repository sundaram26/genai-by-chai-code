import { NextResponse } from "next/server";
import { Tokenizer } from "@all-genai-assignments/tokenizer";
import vocabData from "@all-genai-assignments/tokenizer/vocab.json";
import mergesData from "@all-genai-assignments/tokenizer/merges.json";

// Initialize and load tokenizer
const tokenizer = new Tokenizer();
tokenizer.loadFromData(
  vocabData as Record<number, number[]>, 
  mergesData as Record<string, number>
);

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text input" }, { status: 400 });
    }

    const result = tokenizer.tokenize(text);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Tokenization API Error:", error);
    return NextResponse.json({ error: error.message || "Tokenization failed" }, { status: 500 });
  }
}
