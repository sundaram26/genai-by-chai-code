import { ChatRequest, ChatResponse } from "./types";

export interface LLMProvider {
    readonly name: string;

    generate(input: ChatRequest): Promise<ChatResponse>;
    generateStream?(input: ChatRequest): AsyncGenerator<ChatResponse, void, unknown>;
}