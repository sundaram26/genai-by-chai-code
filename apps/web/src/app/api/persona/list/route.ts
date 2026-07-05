import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

export async function GET() {
  try {
    // packages/persona/data is located relative to apps/web directory
    const dataDir = path.resolve(process.cwd(), "../../packages/persona/data");
    
    const personas: any[] = [];
    try {
      const dirs = await fs.readdir(dataDir);
      for (const dir of dirs) {
        const cardPath = path.join(dataDir, dir, "final", "persona_card.json");
        try {
          const content = await fs.readFile(cardPath, "utf8");
          const card = JSON.parse(content);
          personas.push(card);
        } catch {
          // Skip dirs without a compiled final persona_card.json
        }
      }
    } catch (err) {
      console.warn("Data directory not found or empty. Returning empty list.", err);
    }

    return NextResponse.json({ personas });
  } catch (error: any) {
    console.error("List Personas Error:", error);
    return NextResponse.json({ error: error.message || "Failed to list personas." }, { status: 500 });
  }
}
