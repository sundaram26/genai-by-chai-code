import { OpenAI } from "openai";
import { ChatResponse } from "./sdk/types";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const EvaluationSchema = z.object({
    analysis: z.string().describe("A brief analysis comparing the different model responses and identifying their strongest parts."),
    final_answer: z.string().describe("The final, best possible synthesized response created by combining the strengths of the models.")
});

export class LlmEvaluator {
    private openaiClient: OpenAI;

    constructor() {
        this.openaiClient = new OpenAI();
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
            const response = await this.openaiClient.chat.completions.create({
                model: "gpt-4o-mini",
                temperature: 0.3,
                messages: [{ role: "user", content: synthesisPrompt }],
                response_format: zodResponseFormat(EvaluationSchema, "evaluation")
            });

            // Extract the structured JSON output
            const content = response.choices[0]?.message?.content;
            if (!content) {
                return "Failed to generate synthesized response.";
            }
            
            const parsed = JSON.parse(content);
            return parsed.final_answer || "Failed to extract final answer from response.";
        } catch (error: any) {
            console.error("Evaluation failed:", error);
            return "Error during evaluation: " + error.message;
        }
    }
}
