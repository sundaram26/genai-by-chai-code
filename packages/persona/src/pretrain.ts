import * as fs from "fs/promises";
import * as path from "path";
import { ingestSources, cleanAndChunk, analyzeChunks, compilePersona } from "./index";

async function runPretrain() {
  console.log("--------------------------------------------------");
  console.log("   STARTING PERSONA PIPELINE PRE-TRAINING RUN     ");
  console.log("--------------------------------------------------");

  const personas = ["hitesh", "piyush"];

  for (const name of personas) {
    console.log(`\n=================== Compiling: ${name.toUpperCase()} ===================`);
    try {
      const folderPath = path.resolve(__dirname, "..", "datasets", name);
      
      let transcriptText = "";
      let tweetsText: string[] = [];

      try {
        transcriptText = await fs.readFile(path.join(folderPath, "youtube_transcript.txt"), "utf8");
      } catch (err) {
        console.warn(`Warning: Could not read youtube_transcript.txt for ${name}`);
      }

      try {
        const tweetsRaw = await fs.readFile(path.join(folderPath, "tweets.txt"), "utf8");
        tweetsText = tweetsRaw.split("\n").map(t => t.trim()).filter(Boolean);
      } catch (err) {
        console.warn(`Warning: Could not read tweets.txt for ${name}`);
      }

      // Step 1: Ingest
      console.log("Ingesting raw source files...");
      const rawDir = await ingestSources(name, {
        text: transcriptText ? [transcriptText] : [],
        twitter: tweetsText
      });
      console.log(`Ingested in: ${rawDir}`);

      // Step 2: Clean
      console.log("Cleaning and segmenting...");
      await cleanAndChunk(name);

      // Step 3: Chunk Analysis (LLM check)
      console.log("Running LLM feature extraction pass...");
      await analyzeChunks(name);

      // Step 4: Map-Reduce Compile
      console.log("Merging profiles and compiling final card package...");
      const finalDir = await compilePersona(name);

      console.log(`Successfully compiled card for ${name.toUpperCase()} in final/ directory: ${finalDir}`);
    } catch (error) {
      console.error(`Failed to pretrain persona "${name}":`, error);
    }
  }

  console.log("\n--------------------------------------------------");
  console.log("       PRE-TRAINING COMPLETE FOR ALL PERSONAS     ");
  console.log("--------------------------------------------------");
}

runPretrain();
