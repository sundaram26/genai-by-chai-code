import { Anthropic } from "@anthropic-ai/sdk";
import { ChatResponse } from "./sdk/types";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const EvaluationSchema = z.object({
    analysis: z.string().describe("A brief analysis comparing the different model responses and identifying their strongest parts."),
    final_answer: z.string().describe("The final, best possible synthesized response created by combining the strengths of the models.")
});

export class LlmEvaluator {
    private anthropicClient: Anthropic;

    constructor() {
        this.anthropicClient = new Anthropic();
    }

    async evaluate(prompt: string, responses: Record<string, ChatResponse>): Promise<string> {
        let responsesText = "";
        
        for (const [model, response] of Object.entries(responses)) {
            if (response.text) {
                responsesText += `<response model="${model}">\n${response.text}\n</response>\n\n`;
            }
        }

        const synthesisPrompt = `You are a final evaluator model in a self-consistency pipeline.
            The user asked the following question:
            "${prompt}"

            Several different AI models were asked the same question. Here are their responses:

            ${responsesText}

            Your task is to compare these outputs, identify the strongest parts, and generate the best possible final response. 
            The final answer should not simply copy one model’s response. It should be a refined output created after analyzing all model responses.`;

        try {
            const response = await this.anthropicClient.messages.parse({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 2048,
                temperature: 0.3,
                messages: [{ role: "user", content: synthesisPrompt }],
                output_config: { format: zodOutputFormat(EvaluationSchema) }
            });

            // Return the parsed and validated structured response
            return response.parsed_output?.final_answer || "Failed to generate synthesized response.";
        } catch (error: any) {
            console.error("Evaluation failed:", error);
            return "Error during evaluation: " + error.message;
        }
    }
}
