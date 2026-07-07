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

export async function GET() {
  try {
    return NextResponse.json({
      vocab: tokenizer.getVocabList(),
      merges: tokenizer.getMergesList(),
    });
  } catch (error: any) {
    console.error("Vocab API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load vocabulary" }, { status: 500 });
  }
}
