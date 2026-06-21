"use client";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-900/50 bg-red-950/30 p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-red-400">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-red-300/80">{message}</p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
