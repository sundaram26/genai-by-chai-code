import Link from "next/link";
import { ExternalLink, Linkedin, Github } from "lucide-react";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" width="24" height="24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans">
      <div className="w-full max-w-3xl px-8 flex flex-col justify-center">
        {/* Header Section */}
        <header className="mb-20">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            GenAI Assignments
          </h1>
          <p className="text-neutral-500 font-light text-lg max-w-lg leading-relaxed mb-8">
            A collection of generative AI tools, experiments, and projects by Sundaram.
          </p>
          <a
            href="https://sundaram.hashnode.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium border-b border-neutral-300 pb-1 hover:border-neutral-900 transition-colors"
          >
            Read my writing <ExternalLink size={14} className="opacity-70" />
          </a>
        </header>

        {/* Projects Section */}
        <div className="w-full">
          <div className="border-t border-neutral-200">
            <Link href="/tokenizer" className="group flex flex-col sm:flex-row sm:items-center justify-between py-8 border-b border-neutral-200 hover:bg-neutral-50 transition-colors -mx-4 px-4">
              <div>
                <h2 className="text-xl font-medium tracking-tight group-hover:text-neutral-600 transition-colors">Tokenizer</h2>
                <p className="text-neutral-500 text-sm mt-1 font-light">Inspect BPE tokenization, vocabulary entries, and metrics.</p>
              </div>
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900 transition-colors">
                Explore ↗
              </span>
            </Link>

            <Link href="/persona" className="group flex flex-col sm:flex-row sm:items-center justify-between py-8 border-b border-neutral-200 hover:bg-neutral-50 transition-colors -mx-4 px-4">
              <div>
                <h2 className="text-xl font-medium tracking-tight group-hover:text-neutral-600 transition-colors">Persona</h2>
                <p className="text-neutral-500 text-sm mt-1 font-light">Chat with distinct personas using markdown system prompts.</p>
              </div>
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900 transition-colors">
                Explore ↗
              </span>
            </Link>
          </div>
        </div>

        {/* Footer / Socials */}
        <footer className="mt-24 flex items-center gap-8 text-neutral-400">
          <a href="https://x.com/sundaram_04" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors" aria-label="X (Twitter)">
            <XIcon className="w-5 h-5" />
          </a>
          <a href="https://www.linkedin.com/in/sundaram-singh-b5aa4823b/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors" aria-label="LinkedIn">
            <Linkedin size={20} strokeWidth={1.5} />
          </a>
          <a href="https://github.com/Sundaram26/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors" aria-label="GitHub">
            <Github size={20} strokeWidth={1.5} />
          </a>
        </footer>
      </div>
    </main>
  );
}
