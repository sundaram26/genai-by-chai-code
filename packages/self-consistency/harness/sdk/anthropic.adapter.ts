import { LLMProvider } from "./llm.interface";
import { Anthropic } from "@anthropic-ai/sdk";
import { ChatRequest, ChatResponse } from "./types";




export class AnthropicAdapter implements LLMProvider {
    name = "anthropic";
    client = new Anthropic();

    async generate(input: ChatRequest): Promise<ChatResponse> {
        const systemMessage = input.messages.find(m => m.role === "system")?.content;
        const nonSystemMessages = input.messages.filter(m => m.role !== "system");

        const response = await this.client.messages.create({
            model: input.modelHint || "claude-3-5-sonnet-20240620",
            messages: nonSystemMessages as any,
            system: systemMessage,
            temperature: input.temperature,
            max_tokens: input.maxTokens || 1024,
            stream: false,
        });

        const textBlocks = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text);

        return {
            text: textBlocks.join("\n"),
            raw: response,
        };
    }

    async *generateStream(input: ChatRequest): AsyncGenerator<ChatResponse, void, unknown> {
        const systemMessage = input.messages.find(m => m.role === "system")?.content;
        const nonSystemMessages = input.messages.filter(m => m.role !== "system");

        const stream = await this.client.messages.create({
            model: input.modelHint || "claude-3-5-sonnet-20240620",
            messages: nonSystemMessages as any,
            system: systemMessage,
            temperature: input.temperature,
            max_tokens: input.maxTokens || 1024,
            stream: true,
        });

        for await (const messageStreamEvent of stream) {
            let text: string | undefined = undefined;
            if (messageStreamEvent.type === "content_block_delta" && messageStreamEvent.delta.type === "text_delta") {
                text = messageStreamEvent.delta.text;
            }
            yield {
                text,
                raw: messageStreamEvent,
            };
        }
    }
}