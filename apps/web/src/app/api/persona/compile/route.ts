import { NextResponse } from "next/server";
import { ingestSources, cleanAndChunk, analyzeChunks, compilePersona } from "@all-genai-assignments/persona";

export async function POST(req: Request) {
  try {
    const { name, youtube, website, twitter, text } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Persona name is required." }, { status: 400 });
    }

    console.log(`Starting compilation pipeline for persona: ${name}`);

    // Step 1: Ingest
    const rawDir = await ingestSources(name, { youtube, website, twitter, text });
    console.log(`Ingestion completed in directory: ${rawDir}`);

    // Step 2: Clean & Chunk
    const cleanDir = await cleanAndChunk(name);
    console.log(`Cleaning and chunking completed in: ${cleanDir}`);

    // Step 3: Analyze
    const analyzeDir = await analyzeChunks(name);
    console.log(`LLM Chunk analysis completed in: ${analyzeDir}`);

    // Step 4: Compile
    const finalDir = await compilePersona(name);
    console.log(`Compiler Map-Reduce pass finished. Persona PKP saved in: ${finalDir}`);

    return NextResponse.json({
      success: true,
      message: `Compiled persona "${name}" successfully.`,
      finalDir
    });
  } catch (error: any) {
    console.error("Compilation Pipeline Error:", error);
    return NextResponse.json({ error: error.message || "Failed to compile persona." }, { status: 500 });
  }
}
