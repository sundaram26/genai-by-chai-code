# GenAI Assignments Portfolio

This repository contains a collection of three generative AI applications built as part of the GenAI curriculum. Each project is implemented with a dedicated frontend interface and backend architecture.

**Base Hosted URL:** [https://genaicohort.vercel.app](https://genaicohort.vercel.app)

---

## 1. Tokenizer Visualizer
A pedagogical tool to visualize and understand how Large Language Models chunk text into tokens using Byte-Pair Encoding (BPE) and similar tokenization strategies.

**Access Route:** [https://genaicohort.vercel.app/tokenizer](https://genaicohort.vercel.app/tokenizer)

### Overview
- **Functionality**: Users can type or paste text into the UI and instantly see how the text is divided into individual tokens, complete with color-coding and token counts.
- **Frontend**: Built with Next.js, featuring a clean, responsive interface that highlights tokens dynamically.

---

## 2. AI Persona Simulator (Hitesh & Piyush)
A dynamic, real-time streaming LLM-based chat interface that accurately simulates the personalities, teaching styles, and technical domain knowledge of tech educators Hitesh Choudhary and Piyush Garg.

**Access Route:** [https://genaicohort.vercel.app/persona](https://genaicohort.vercel.app/persona)

### Documentation & How It Works
1. **Data Collection**: I transcribed live YouTube videos and scraped portfolio websites for Hitesh and Piyush to capture their unscripted speaking rhythm, filler words ("dekho", "samajh aa raha hai"), and tech stacks.
2. **Prompt Engineering**: This data was formatted into highly detailed Markdown files used as Static System Prompts. These enforce strict stylistic constraints (e.g., native "Hinglish") and anti-style rules (no robotic AI boilerplate).
3. **Context Management**: The frontend manages the message array, while the backend injects the massive system prompt at the top of the context window. The response is streamed back in real-time (SSE) for a snappy typing effect.
4. **Frontend**: Features a glassmorphic brutalist chat UI built with Next.js and TailwindCSS.

### Sample Conversation (Piyush)
**User**: Should I do DSA or Rust?
**Piyush**: Haan ji, dekho DSA ko subject mat padho. Enjoy it. DSA is a part of your coding journey. And yes, you can do DSA in Rust. Bas problem statement se resonate karo ki bhai mere ko jo seekhna hai kya wo ek problem statement solve kar rahi hai. You are getting my point, right?

---

## 3. Self-Consistency Agent
An advanced GenAI pipeline that queries multiple LLMs simultaneously and uses a final evaluator model to synthesize the best possible consensus answer.

**Access Route:** [https://genaicohort.vercel.app/self-consistency](https://genaicohort.vercel.app/self-consistency)

### Overview & How It Works
- **Multiple Models**: The user submits a prompt, which is broadcasted in parallel to OpenAI (GPT-4o), Anthropic (Claude 3.5), and Google (Gemini 1.5).
- **Evaluation Engine**: After collecting all raw responses, the system passes them to a final evaluator model (OpenAI GPT-4o-mini).
- **Structured Outputs**: The evaluator uses strict JSON Structured Outputs (`zodResponseFormat`) to compare the outputs, identify the strongest parts of each, and generate a final synthesized response.
- **Frontend**: A minimalist, dual-column UI that cleanly separates the configuration/prompting from the grid of raw model responses and the final majority vote.

---

## 🛠 Setup & Run Instructions (Local Development)

This repository is built as a monorepo containing multiple packages and a Next.js web application.

### 1. Installation
Ensure you have `pnpm` installed. Run the following command at the root of the project to install dependencies:
```bash
pnpm install
```

### 2. Environment Variables
Create `.env` files for the frontend and the specific backend packages you are running.

**Frontend (`apps/web/.env`)**:
```env
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Self-Consistency API (`packages/self-consistency/.env`)**:
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Running the Project

Start the Next.js frontend (which runs on port 3000 by default):
```bash
npm run dev
# or
pnpm dev
```

*(Note: Ensure you start the respective backend Express servers located in the `packages/` directory if you are testing their API routes locally.)*

### 4. Viewing Locally
Navigate to the following URLs in your browser:
- **Tokenizer**: `http://localhost:3000/tokenizer`
- **Persona**: `http://localhost:3000/persona`
- **Self-Consistency**: `http://localhost:3000/self-consistency`
