# AI Persona Simulator: Hitesh Choudhary & Piyush Garg

A highly dynamic, streaming LLM-based chat interface that accurately simulates the personalities, teaching styles, and technical domain knowledge of tech educators Hitesh Choudhary and Piyush Garg.

## Features Built

- ✅ **Working LLM Chat Interface**: A premium, glassmorphic UI built in Next.js.
- ✅ **Persona Switching**: Instantly switch between Hitesh and Piyush in real-time.
- ✅ **Automated Persona Compiler Pipeline**: A robust Node.js backend that ingests YouTube captions and portfolio websites, analyzes writing styles, and compiles structural JSON persona cards.
- ✅ **Real-Time Streaming**: Integrated with Vercel AI SDK and OpenAI-compatible endpoints to stream responses chunk-by-chunk.

---

## 🛠 Setup & Run Instructions

This project is structured as a Turborepo monorepo containing a Next.js frontend (`apps/web`) and a Persona Compiler backend (`packages/persona`).

### 1. Installation
Ensure you have `pnpm` installed. Run the following command at the root of the project:
```bash
pnpm install
```

### 2. Environment Variables
Create a `.env` file in `apps/web/.env` (or copy `.env.example` if it exists) and add your API keys. We use OpenAI-compatible routing for maximum flexibility (OpenAI, Groq, Together, or LM Studio).
```env
OPENAI_API_KEY=your_api_key_here
# Optional: Override the model (defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

*(If you plan to re-run the Persona Compiler Pipeline to ingest new data, you will also need to provide `GEMINI_API_KEY` for the Map-Reduce style analysis phase).*

### 3. Run the Development Server
```bash
pnpm dev
```
Navigate to `http://localhost:3000/persona` to interact with the Chatbot!

*(Note: The admin compiler console is hidden behind a secure hashed route for safety: `/persona-console-4f8a9b2d1e7c6d5f4a3b2c1d0e9f8a7b`)*

---

## 📚 Documentation

### 1. How Persona Data Was Collected & Prepared
The persona compilation relies on a custom-built automated Map-Reduce data ingestion pipeline located in `packages/persona`. 
- **Ingestion (Cheerio & XML)**: We built a custom web scraper using Cheerio to recursively extract text from the creators' portfolio websites. We also extract raw XML caption tracks directly from public YouTube videos.
- **Cleaning & Chunking**: The raw data is stripped of HTML noise, normalized, and split into ~1000-token chunks.
- **LLM Feature Extraction (Gemini)**: Every single chunk is analyzed by Gemini 1.5 Flash to extract tone, teaching style, sentence rhythms, and anti-style constraints. (e.g., *If Devnagari Hindi is detected, the pipeline automatically transliterates it to Romanized Hinglish*).
- **Map-Reduce Compilation**: All the chunk analyses are merged into a single, highly detailed `persona_card.json` artifact.

### 2. Prompt Engineering Strategy
We utilize **Long-Context System Prompt Injection** driven by the compiled `persona_card.json`. Instead of writing a generic prompt, the streaming API (`/api/persona/stream`) dynamically constructs a massive system prompt containing:
- **Role & Audience definitions.**
- **Stylistic Constraints**: Enforcing exact sentence rhythms (e.g., short/punchy vs long/detailed) and directness levels.
- **Anti-Style Rules**: A strict block of "Never Do These" rules (e.g., "Never use generic AI boilerplate like 'In conclusion'").
- **Phrase Banks**: Injecting actual catchphrases extracted from their transcripts.

*Example Prompt Structure:*
> "You are playing the role of Hitesh. Audience: Tech students. Tone: Casual, Empathetic. Anti-Style: Do not overcomplicate explanations. Do not use robotic greetings. Phrase Bank: 'simple hai', 'bro coding is simple'."

### 3. Context Management Approach
To maintain performance and character accuracy over long conversations, the frontend relies on the Vercel AI SDK standard message history array. 
The backend receives the entire `messages` array, injects the massive, highly constrained System Prompt at the very top of the context window as the absolute source of truth, and passes it to the LLM. Because the System Prompt contains explicit anti-style rules, the LLM is heavily anchored to the persona regardless of how the user guides the context.

---

## 💬 Sample Conversations

### Hitesh Choudhary
**User**: How should I learn Next.js?
**Hitesh**: See bro, learning Next.js is simple hai. Don't overcomplicate it by reading 50 tutorials. Just build a basic app first. Understand the App Router, and write clean logic. You fail if you overthink the boilerplate.

### Piyush Garg
**User**: Can you explain how BPE tokenization works?
**Piyush**: Hello, aap log kaise ho? So basically, BPE (Byte Pair Encoding) is just merging the most common pairs. Think of it like a simple list folding problem. It’s a core system architecture concept. Let me show you practically how we merge UTF-8 byte boundaries...
