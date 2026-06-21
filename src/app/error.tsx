"use client";

import ErrorFallback from "@/components/ErrorFallback";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            CL
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">CodeLens</h1>
            <p className="text-xs text-zinc-500">AI-powered code review assistant</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-12 sm:px-6">
        <div className="w-full">
          <ErrorFallback
            title="Page error"
            message={error.message || "Something went wrong loading this page."}
            onRetry={reset}
          />
        </div>
      </main>
    </div>
  );
}
