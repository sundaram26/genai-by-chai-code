import { Router } from "express";
import { evaluateAgent } from "../controllers/agent.controllers";

const agentRoute = Router();


agentRoute.post("/evaluate", evaluateAgent);

export default agentRoute;
