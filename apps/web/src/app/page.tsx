import Link from "next/link";
import { Bot, Braces, ArrowRight } from "lucide-react";

const apps = [
  {
    href: "/tokenizer",
    name: "Tokenizer",
    description: "Inspect BPE tokenization, vocabulary entries, merge rules, and token metrics.",
    icon: Braces,
  },
  {
    href: "/persona",
    name: "Persona",
    description: "Chat with Piyush or Hitesh using markdown system prompts from the persona package.",
    icon: Bot,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <header className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            GenAI Assignments
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Choose an app
          </h1>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {apps.map((app) => {
            const Icon = app.icon;

            return (
              <Link
                key={app.href}
                href={app.href}
                className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                    <Icon size={22} />
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-500"
                  />
                </div>
                <h2 className="mb-2 text-xl font-bold">{app.name}</h2>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {app.description}
                </p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
