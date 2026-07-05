import { LLMProvider, LLMRequest } from "./router";

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";

  private getApiKey() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
    }
    return key;
  }

  private getModel() {
    return process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  }

  async generateText(req: LLMRequest): Promise<string> {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    
    const body: any = {
      model,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: req.prompt
        }
      ],
      temperature: req.temperature ?? 0.2
    };

    if (req.systemPrompt) {
      body.system = req.systemPrompt;
    }

    if (req.responseFormat === "json") {
      const jsonInstruction = "IMPORTANT: Return raw JSON only. Do not wrap in markdown or explain your output.";
      if (body.system) {
        body.system = `${body.system}\n\n${jsonInstruction}`;
      } else {
        body.system = jsonInstruction;
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "Anthropic-Version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
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
      console.error("Failed to parse JSON output from Anthropic:", text);
      throw err;
    }
  }
}
