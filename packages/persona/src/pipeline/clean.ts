import * as fs from "fs/promises";
import * as path from "path";
import { RawDocument } from "../types";

export interface CleanedChunk {
  chunkId: string;
  source_id: string;
  source_type: string;
  text: string;
  platform: string;
  context: string;
}

export async function cleanAndChunk(personaName: string): Promise<string> {
  const personaSlug = personaName.toLowerCase().replace(/\s+/g, "_");
  const rawDirPath = path.resolve(__dirname, "../../data", personaSlug, "raw");
  const cleanDirPath = path.resolve(__dirname, "../../data", personaSlug, "cleaned");
  
  await fs.mkdir(cleanDirPath, { recursive: true });

  const rawFiles = await fs.readdir(rawDirPath);
  const jsonFiles = rawFiles.filter(f => f.endsWith(".json"));

  let totalChunksCount = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(rawDirPath, file);
    const content = await fs.readFile(filePath, "utf8");
    const doc = JSON.parse(content) as RawDocument;

    let cleanText = doc.raw_text;

    // Clean HTML content
    if (cleanText.includes("<") && cleanText.includes(">")) {
      cleanText = cleanText
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    }

    // Clean excessive whitespaces
    cleanText = cleanText.replace(/\s+/g, " ").trim();

    // Chunking text: roughly 750 words (~1000 tokens)
    const words = cleanText.split(" ");
    const chunkSize = 750;
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkText = chunkWords.join(" ");

      const chunk: CleanedChunk = {
        chunkId: `${doc.source_id}_chunk_${chunkIndex}`,
        source_id: doc.source_id,
        source_type: doc.source_type,
        text: chunkText,
        platform: doc.platform,
        context: doc.context
      };

      const outPath = path.join(cleanDirPath, `${chunk.chunkId}.json`);
      await fs.writeFile(outPath, JSON.stringify(chunk, null, 2), "utf8");
      chunkIndex++;
      totalChunksCount++;
    }
  }

  console.log(`Cleaned and chunked ${jsonFiles.length} files into ${totalChunksCount} chunks.`);
  return cleanDirPath;
}
