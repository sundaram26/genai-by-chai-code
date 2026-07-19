import { Request, Response } from "express";
import { agentService } from "../services/agent.services";
import { z } from "zod";

const EvaluateSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    models: z.array(z.string()).min(1, "At least one model must be specified")
});

export const evaluateAgent = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedBody = EvaluateSchema.parse(req.body);
        
        const result = await agentService.evaluatePrompt(
            parsedBody.prompt,
            parsedBody.models
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        
        console.error("Error evaluating agent:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};
