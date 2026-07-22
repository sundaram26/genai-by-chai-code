import "dotenv/config";
import express from "express";
import cors from "cors";
import agentRoute from "./routers/agent.routers";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.send("Healthy");
});

app.use("/api/agent", agentRoute);

const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});