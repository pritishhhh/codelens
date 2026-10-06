"use client";

import { useEffect, useRef, useState } from "react";
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
import ReportExport from "@/components/ReportExport";
import { validateReviewResult } from "@/lib/validateReview";
import { validateCompareResult } from "@/lib/validateCompare";
import type { CompareResult } from "@/types/compare";
import type { SupportedLanguage } from "@/types/language";
import type { ReviewResult } from "@/types/review";

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
  const [submittedComparison, setSubmittedComparison] = useState<CompareInputSubmitPayload | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const lastSubmission = useRef<CodeInputSubmitPayload | CompareInputSubmitPayload | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const cancelRequest = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsLoading(false);
  };

  const resetResults = () => {
    setError(null);
    setReview(null);
    setCompareResult(null);
    setSubmittedCode(null);
    setSubmittedComparison(null);
    setResultsKey((key) => key + 1);
  };

  const handleModeChange = (nextMode: AppMode) => {
    if (nextMode === mode) return;
    cancelRequest();
    lastSubmission.current = null;
    setMode(nextMode);
    resetResults();
    setIsLoading(false);
  };

  const submitAnalysis = async (payload: CodeInputSubmitPayload | CompareInputSubmitPayload) => {
    cancelRequest();
    const controller = new AbortController();
    requestRef.current = controller;
    lastSubmission.current = payload;
    setIsLoading(true);
    resetResults();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 120_000);
    try {
      const isReview = "code" in payload;
      const response = await fetch(isReview ? "/api/review" : "/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an unreadable response. Please try again.");
      }
      if (requestRef.current !== controller) return;

      if (!response.ok) {
        const apiError = data as { error?: unknown } | null;
        throw new Error(typeof apiError?.error === "string" ? apiError.error : "Analysis request failed.");
      }
      try {
        if (isReview) {
          setReview(validateReviewResult(data, payload.code.split("\n").length));
          setSubmittedCode({ code: payload.code, language: payload.language });
        } else {
          setCompareResult(validateCompareResult(data));
          setSubmittedComparison(payload);
        }
      } catch {
        throw new Error("The server returned an invalid analysis. Please try again.");
      }
    } catch (submitError) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;
      const message =
        submitError instanceof Error ? submitError.message : "An unexpected error occurred.";
      setError(timedOut ? "Analysis timed out. Please try again with a shorter snippet." : message);
    } finally {
      window.clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const retryAnalysis = () => {
    if (lastSubmission.current) void submitAnalysis(lastSubmission.current);
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
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const nextMode = event.key === "Home" ? "review" : event.key === "End" ? "compare" : mode === "review" ? "compare" : "review";
                  handleModeChange(nextMode);
                  document.getElementById(`${nextMode}-tab`)?.focus();
                }
              }}
            >
              <button
                type="button"
                role="tab"
                id="review-tab"
                aria-controls="review-input"
                tabIndex={mode === "review" ? 0 : -1}
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
                id="compare-tab"
                aria-controls="compare-input"
                tabIndex={mode === "compare" ? 0 : -1}
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

        <section id="review-input" role="tabpanel" aria-labelledby="review-tab" hidden={mode !== "review"}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <CodeInput onSubmit={submitAnalysis} isLoading={isLoading} />
        </section>
        <section id="compare-input" role="tabpanel" aria-labelledby="compare-tab" hidden={mode !== "compare"}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <CompareInput onSubmit={submitAnalysis} isLoading={isLoading} />
        </section>

        <section aria-label="Results" className="mt-6 sm:mt-8">
          {isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <div role="status" className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">Analysis in progress…</p>
                <button type="button" onClick={cancelRequest} className="tool-button">Cancel analysis</button>
              </div>
              {mode === "review" ? <ReviewResultsSkeleton /> : <CompareResultsSkeleton />}
            </div>
          )}

          {error && !isLoading && (
            <ErrorFallback
              title={mode === "review" ? "Review failed" : "Comparison failed"}
              message={error}
              onRetry={retryAnalysis}
            />
          )}

          {mode === "review" && review && submittedCode && !isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <ReportExport report={{ kind: "review", result: review, ...submittedCode }} />
              <ErrorBoundary key={resultsKey} onReset={resetResults}>
                <ResultsPanel review={review} code={submittedCode.code} />
              </ErrorBoundary>
            </div>
          )}

          {mode === "compare" && compareResult && submittedComparison && !isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <ReportExport report={{ kind: "compare", result: compareResult, ...submittedComparison }} />
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
