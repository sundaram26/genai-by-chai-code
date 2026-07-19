import { LLMProvider } from "./llm.interface";
import { ChatRequest, ChatResponse } from "./types";
import { OpenAI } from "openai";

export class OpenAiAdapter implements LLMProvider {
    readonly name = "openai";

    client = new OpenAI();
    constructor() {}

    async generate(input: ChatRequest): Promise<ChatResponse> {
        const response = await this.client.chat.completions.create({
            model: input.modelHint || "gpt-4o-mini",
            messages: input.messages as any, // Cast to bypass strict SDK type checks for custom Message
            temperature: input.temperature,
            max_tokens: input.maxTokens,
            stream: false,
        });

        const choice = response.choices[0];
        const message = choice.message;

        return {
            text: message.content || undefined,
            toolCalls: message.tool_calls?.map((tc: any) => ({
                id: tc.id,
                name: tc.function?.name,
                input: tc.function?.arguments
            })),
            raw: response
        };
    }

    async *generateStream(input: ChatRequest): AsyncGenerator<ChatResponse, void, unknown> {
        const stream = await this.client.chat.completions.create({
            model: input.modelHint || "gpt-4o-mini",
            messages: input.messages as any,
            temperature: input.temperature,
            max_tokens: input.maxTokens,
            stream: true,
        });

        for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;
            
            yield {
                text: delta.content || undefined,
                toolCalls: delta.tool_calls?.map((tc: any) => ({
                    id: tc.id || "",
                    name: tc.function?.name || "",
                    input: tc.function?.arguments || ""
                })),
                raw: chunk
            };
        }
    }
}