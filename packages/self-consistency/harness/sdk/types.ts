export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ToolSpec<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: unknown;
  execute: (input: TInput) => Promise<TOutput>;
}

export interface ChatRequest {
  messages: Message[];
  tools?: ToolSpec[];
  temperature?: number;
  maxTokens?: number;
  modelHint?: string;
}

export interface ToolCall {
  name: string;
  input: unknown;
  id: string;
}

export interface ChatResponse {
  text?: string;
  toolCalls?: ToolCall[];
  raw?: unknown;
}
