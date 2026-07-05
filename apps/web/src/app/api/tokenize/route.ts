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

    const tokens = tokenizer.bpeEncode(text);
    const vocab = tokenizer.getVocab();
    
    const tokenDetails = tokens.map((id) => {
      const bytes = vocab.get(id) || new Uint8Array();
      
      // Safe decoding of bytes
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
    });

    const totalBytes = new TextEncoder().encode(text).length;
    const compressionRatio = tokens.length > 0 ? (totalBytes / tokens.length).toFixed(2) : "0.00";

    return NextResponse.json({
      tokens,
      tokenDetails,
      metrics: {
        charCount: text.length,
        byteCount: totalBytes,
        tokenCount: tokens.length,
        compressionRatio,
      },
    });
  } catch (error: any) {
    console.error("Tokenization API Error:", error);
    return NextResponse.json({ error: error.message || "Tokenization failed" }, { status: 500 });
  }
}
