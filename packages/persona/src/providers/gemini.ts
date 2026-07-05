import { LLMProvider, LLMRequest } from "./router";

export class GeminiProvider implements LLMProvider {
  name = "gemini";

  private getApiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }
    return key;
  }

  private getModel() {
    return process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  async generateText(req: LLMRequest): Promise<string> {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    
    const body: any = {
      contents: [
        {
          parts: [
            {
              text: req.prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: req.temperature ?? 0.2,
        responseMimeType: req.responseFormat === "json" ? "application/json" : undefined
      }
    };

    if (req.systemPrompt) {
      body.systemInstruction = {
        parts: [
          {
            text: req.systemPrompt
          }
        ]
      };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async generateJson<T>(req: LLMRequest): Promise<T> {
    const text = await this.generateText({
      ...req,
      responseFormat: "json"
    });
    
    try {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error("Failed to parse JSON output from Gemini:", text);
      throw err;
    }
  }
}
