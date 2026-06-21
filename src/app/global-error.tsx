"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
            <h1 className="text-lg font-semibold text-red-400">CodeLens encountered an error</h1>
            <p className="mt-2 text-sm text-red-300/80">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
