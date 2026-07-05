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

export async function GET(req: Request) {
  try {
    const vocab = tokenizer.getVocab();
    const merges = tokenizer.getMerges();

    const vocabList = Array.from(vocab.entries()).map(([id, bytes]) => {
      let textValue = "";
      try {
        textValue = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      } catch {
        textValue = "";
      }
      return {
        id,
        text: textValue,
        bytes: Array.from(bytes),
      };
    }).sort((a, b) => a.id - b.id);

    const mergesList = Array.from(merges.entries()).map(([pair, id]) => {
      const [first, second] = pair.split("-").map(Number);
      return {
        id,
        pair,
        first,
        second
      };
    }).sort((a, b) => a.id - b.id);

    return NextResponse.json({
      vocab: vocabList,
      merges: mergesList,
    });
  } catch (error: any) {
    console.error("Vocab API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load vocabulary" }, { status: 500 });
  }
}
