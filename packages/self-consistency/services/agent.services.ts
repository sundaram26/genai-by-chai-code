import { LlmRunner } from "../harness/llm.runner";
import { LlmEvaluator } from "../harness/llm.evaluate";

export class AgentService {
    private runner: LlmRunner;
    private evaluator: LlmEvaluator;

    constructor() {
        this.runner = new LlmRunner();
        this.evaluator = new LlmEvaluator();
    }

    async evaluatePrompt(prompt: string, models: string[]) {
        const responses = await this.runner.run(models, prompt);
        
        const bestAnswer = await this.evaluator.evaluate(prompt, responses);

        return {
            bestAnswer,
            rawResponses: responses
        };
    }
}

export const agentService = new AgentService();
