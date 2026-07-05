import { LLMProvider, LLMRequest } from "./router";

export class OpenAIProvider implements LLMProvider {
  name = "openai";

  private getApiKey() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("Missing OPENAI_API_KEY environment variable.");
    }
    return key;
  }

  private getModel() {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generateText(req: LLMRequest): Promise<string> {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    
    const messages: any[] = [];
    if (req.systemPrompt) {
      messages.push({ role: "system", content: req.systemPrompt });
    }
    messages.push({ role: "user", content: req.prompt });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: req.temperature ?? 0.2,
        response_format: req.responseFormat === "json" ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
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
      console.error("Failed to parse JSON output from OpenAI:", text);
      throw err;
    }
  }
}
