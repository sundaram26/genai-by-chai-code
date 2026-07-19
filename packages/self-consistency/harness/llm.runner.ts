import { OpenAiAdapter } from "./sdk/openai.adapter";
import { AnthropicAdapter } from "./sdk/anthropic.adapter";
import { GeminiAdapter } from "./sdk/gemini.adapter";
import { ChatRequest, ChatResponse, Message } from "./sdk/types";
import { LLMProvider } from "./sdk/llm.interface";

export class LlmRunner {
    private providers: LLMProvider[];

    constructor() {
        this.providers = [
            new OpenAiAdapter(),
            new AnthropicAdapter(),
            new GeminiAdapter(),
        ];
    }

    private getProviderForModel(model: string): LLMProvider {
        const lowerModel = model.toLowerCase();
        
        if (lowerModel.includes("gpt") || lowerModel.includes("o1") || lowerModel.includes("o3")) {
            return this.providers.find(p => p.name === "openai")!;
        }
        if (lowerModel.includes("claude")) {
            return this.providers.find(p => p.name === "anthropic")!;
        }
        if (lowerModel.includes("gemini")) {
            return this.providers.find(p => p.name === "gemini")!;
        }
        
        throw new Error(`Could not determine provider for model: ${model}`);
    }

    async run(models: string[], prompt: string): Promise<Record<string, ChatResponse>> {
        const messages: Message[] = [
            { role: "system", content: "You are a helpful and highly capable AI assistant. Provide a clear, accurate, and comprehensive answer to the user's prompt." },
            { role: "user", content: prompt }
        ];

        const results: Record<string, ChatResponse> = {};

        const promises = models.map(async (model) => {
            const provider = this.getProviderForModel(model);
            const request: ChatRequest = {
                messages,
                modelHint: model,
            };
            
            try {
                const response = await provider.generate(request);
                results[model] = response;
            } catch (error) {
                console.error(`Error running model ${model}:`, error);
                throw error;
            }
        });

        await Promise.all(promises);

        return results;
    }
}
