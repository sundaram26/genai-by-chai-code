import { LLMProvider } from "./llm.interface";
import { ChatRequest, ChatResponse } from "./types";
import { GoogleGenAI } from "@google/genai";

export class GeminiAdapter implements LLMProvider {
    name = "gemini";
    client = new GoogleGenAI({});

    async generate(input: ChatRequest): Promise<ChatResponse> {
        const systemMessage = input.messages.find(m => m.role === "system")?.content;
        const nonSystemMessages = input.messages.filter(m => m.role !== "system");

        // The @google/genai SDK accepts string, array of strings, or Content objects for 'input'
        // We will pass the non-system messages as the primary input.
        const interaction = await this.client.interactions.create({
            model: input.modelHint || "gemini-3.5-flash",
            input: nonSystemMessages as any, // Cast to bypass strict SDK type checks for custom Message
            generation_config: {
                temperature: input.temperature,
                ...(systemMessage ? { system_instruction: systemMessage } : {})
            },
        });

        return {
            text: interaction.output_text,
            raw: interaction,
        };
    }

    async *generateStream(input: ChatRequest): AsyncGenerator<ChatResponse, void, unknown> {
        const systemMessage = input.messages.find(m => m.role === "system")?.content;
        const nonSystemMessages = input.messages.filter(m => m.role !== "system");

        const stream = await this.client.interactions.create({
            model: input.modelHint || "gemini-3.5-flash",
            input: nonSystemMessages as any,
            generation_config: {
                temperature: input.temperature,
                ...(systemMessage ? { system_instruction: systemMessage } : {})
            },
            stream: true,
        });

        for await (const event of stream) {
            let text: string | undefined = undefined;
            if (event.event_type === "step.delta") {
                if (event.delta.type === "text") {
                    text = event.delta.text;
                }
            }
            yield {
                text,
                raw: event,
            };
        }
    }
}
