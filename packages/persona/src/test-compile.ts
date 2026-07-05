import { ingestSources, cleanAndChunk, analyzeChunks, compilePersona } from "./index";

async function runTest() {
  console.log("Running Persona Compiler pipeline integration test...");
  try {
    const name = "TestInstructor";
    await ingestSources(name, {
      text: ["Simple code representation. Writing code is simple. Keep logic direct and clean, guys. Bro, don't overcomplicate. Simple hai."]
    });
    console.log("Ingestion stage - SUCCESS");

    await cleanAndChunk(name);
    console.log("Cleaning & chunking stage - SUCCESS");

    await analyzeChunks(name);
    console.log("LLM Chunk profiling stage - SUCCESS");

    const finalDir = await compilePersona(name);
    console.log(`Map-Reduce Compilation completed! PKP artifacts output: ${finalDir}`);
    console.log("Pipeline Integration - ALL STAGES COMPLETED SUCCESSFULLY");
  } catch (err) {
    console.error("Pipeline integration test failed:", err);
    process.exit(1);
  }
}

runTest();
