"use client";

import { useState } from "react";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import CodeInput, { type CodeInputSubmitPayload } from "@/components/CodeInput";
import CompareInput, { type CompareInputSubmitPayload } from "@/components/CompareInput";
import CompareResultsPanel from "@/components/CompareResultsPanel";
import CompareResultsSkeleton from "@/components/CompareResultsSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorFallback from "@/components/ErrorFallback";
import ResultsPanel from "@/components/ResultsPanel";
import ReviewResultsSkeleton from "@/components/ReviewResultsSkeleton";
import type { CompareApiError, CompareResult } from "@/types/compare";
import type { SupportedLanguage } from "@/types/language";
import type { ReviewApiError, ReviewResult } from "@/types/review";

type AppMode = "review" | "compare";

interface SubmittedCode {
  code: string;
  language: SupportedLanguage;
}

export default function Home() {
  const [mode, setMode] = useState<AppMode>("review");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [submittedCode, setSubmittedCode] = useState<SubmittedCode | null>(null);
  const [resultsKey, setResultsKey] = useState(0);

  const resetResults = () => {
    setError(null);
    setReview(null);
    setCompareResult(null);
    setSubmittedCode(null);
    setResultsKey((key) => key + 1);
  };

  const handleModeChange = (nextMode: AppMode) => {
    setMode(nextMode);
    resetResults();
    setIsLoading(false);
  };

  const handleReviewSubmit = async (payload: CodeInputSubmitPayload) => {
    setIsLoading(true);
    resetResults();

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: payload.code,
          language: payload.language,
        }),
      });

      const data: ReviewResult | ReviewApiError = await response.json();

      if (!response.ok) {
        const apiError = data as ReviewApiError;
        throw new Error(apiError.error || "Review request failed.");
      }

      setReview(data as ReviewResult);
      setSubmittedCode({ code: payload.code, language: payload.language });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareSubmit = async (payload: CompareInputSubmitPayload) => {
    setIsLoading(true);
    resetResults();

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solutionA: payload.solutionA,
          solutionB: payload.solutionB,
          language: payload.language,
        }),
      });

      const data: CompareResult | CompareApiError = await response.json();

      if (!response.ok) {
        const apiError = data as CompareApiError;
        throw new Error(apiError.error || "Compare request failed.");
      }

      setCompareResult(data as CompareResult);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults = mode === "review" ? review !== null : compareResult !== null;
  const emptyMessage =
    mode === "review"
      ? "Results will appear here after you submit code."
      : "Comparison results will appear here after you submit both solutions.";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl lg:text-3xl">
                {mode === "review" ? "Review your code" : "Compare two solutions"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                {mode === "review"
                  ? "Paste a snippet below, choose the language, and get structured feedback on bugs, security, performance, and readability."
                  : "Paste two solutions to the same problem and get an AI ranking with strengths, weaknesses, and reasoning."}
              </p>
            </div>

            <div
              className="flex w-full rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:w-auto"
              role="tablist"
              aria-label="Mode selection"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "review"}
                onClick={() => handleModeChange("review")}
                className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
                  mode === "review"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Review
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "compare"}
                onClick={() => handleModeChange("compare")}
                className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
                  mode === "compare"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Compare
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          {mode === "review" ? (
            <CodeInput onSubmit={handleReviewSubmit} isLoading={isLoading} />
          ) : (
            <CompareInput onSubmit={handleCompareSubmit} isLoading={isLoading} />
          )}
        </section>

        <section aria-label="Results" className="mt-6 sm:mt-8">
          {isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              {mode === "review" ? <ReviewResultsSkeleton /> : <CompareResultsSkeleton />}
            </div>
          )}

          {error && !isLoading && (
            <ErrorFallback
              title={mode === "review" ? "Review failed" : "Comparison failed"}
              message={error}
              onRetry={resetResults}
            />
          )}

          {mode === "review" && review && submittedCode && !isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <ErrorBoundary key={resultsKey} onReset={resetResults}>
                <ResultsPanel review={review} code={submittedCode.code} />
              </ErrorBoundary>
            </div>
          )}

          {mode === "compare" && compareResult && !isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <ErrorBoundary key={resultsKey} onReset={resetResults}>
                <CompareResultsPanel result={compareResult} />
              </ErrorBoundary>
            </div>
          )}

          {!isLoading && !error && !hasResults && (
            <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center sm:py-12">
              <p className="text-sm text-zinc-500">{emptyMessage}</p>
            </div>
          )}
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
