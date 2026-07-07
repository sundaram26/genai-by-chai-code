# AI Persona Simulator: Hitesh Choudhary & Piyush Garg

A dynamic, real-time streaming LLM-based chat interface that accurately simulates the personalities, teaching styles, and technical domain knowledge of tech educators Hitesh Choudhary and Piyush Garg.

## 🚀 Live Demo & Access
If hosted on Vercel (or any other hosting platform), you can interact with the personas directly by navigating to the designated persona route:
**Access Route:** `/persona`

---

## 🛠 Setup & Run Instructions (Local Development)

Follow these steps to run the persona chat locally:

### 1. Installation
Ensure you have `pnpm` installed. Run the following command at the root of the project to install dependencies:
```bash
pnpm install
```

### 2. Environment Variables
Create a `.env` file in the root of the web app (`apps/web/.env`) and add your API keys. I use the OpenAI SDK to connect to any OpenAI-compatible endpoints.

```env
# Define the provider and model
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# Your OpenAI (or compatible) API Key
OPENAI_API_KEY=your_api_key_here

# Base URL (Ensure you DO NOT append /chat/completions)
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 3. Run the Development Server
Start the development server using:
```bash
npm run dev
# or
pnpm dev
```
Once the server is running, navigate to `http://localhost:3000/persona` in your browser to start chatting!

---

## 📚 Documentation

### 1. How Persona Data Was Collected & Prepared
To create authentic, highly accurate personas, I built a comprehensive knowledge base using real-world data sources:
- **Transcripts:** I extracted and transcribed the captions from 10 live YouTube videos for both creators. This allowed the model to capture their unscripted, natural speaking rhythm, filler words (like "dekho", "samajh aa raha hai?"), and live-stream interaction style.
- **Portfolios & Websites:** I scraped their official portfolio websites, product landing pages (e.g., Teachyst, Learnyst, ChaiCode), and course descriptions to build a factual database of their professional achievements, cohorts, and tech stacks.
- **Formatting:** This raw data was compiled into structured Markdown files (`Piyush.md` and `Hitesh.md`). These files serve as the absolute source of truth for the LLM.

### 2. Prompt Engineering Strategy
I utilize **Static Markdown Persona Injection** to drive the LLM's behavior. Instead of dynamically compiling rules on the fly, I rely on highly detailed, hand-crafted system prompts (the `.md` files) that define:
- **Role & Background:** Factual information about their products, courses, and social links.
- **Stylistic Constraints:** Explicit rules on how they speak (e.g., mixing Hindi and English natively into "Hinglish").
- **Anti-Style Rules:** Rules preventing the LLM from hallucinating answers, using robotic AI boilerplate, or formatting with markdown headers/lists unless explicitly requested.
- **Output Constraints:** Restricting responses to 50-150 words to simulate a fast-paced live stream chat.

### 3. Context Management Approach
To maintain performance and character accuracy over long conversations:
- I use a robust **Message DB Array** managed on the frontend.
- For every request, the backend injects the massive, highly constrained Markdown System Prompt at the very top of the context window.
- The entire chat history is appended below it and sent via the OpenAI SDK `stream: true` API.
- Because the System Prompt contains explicit anti-style rules, the LLM remains heavily anchored to the persona regardless of how the user steers the conversation.
- The streaming response is parsed chunk-by-chunk (using Server-Sent Events) to provide a snappy, real-time typing effect in the glassmorphic UI.

---

## 💬 Sample Conversations

### Chatting with Hitesh Choudhary
**User**: Is single machine enough for backend?
**Hitesh**: Dekho, agar scale chhota hai toh single machine bilkul kaam kar leti hai. Problem tab aati hai jab users, requests, aur data bahut badh jaata hai. Tab tradeoff dekhna padta hai. Aazad desh hai, jo mann ho karo — but system ko context ke hisaab se design karo. Samajh aa raha hai?

### Chatting with Piyush Garg
**User**: Should I do DSA or Rust?
**Piyush**: Haan ji, dekho DSA ko subject mat padho. Enjoy it. DSA is a part of your coding journey. And yes, you can do DSA in Rust. Bas problem statement se resonate karo ki bhai mere ko jo seekhna hai kya wo ek problem statement solve kar rahi hai. You are getting my point, right?
