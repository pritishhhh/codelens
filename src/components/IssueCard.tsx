"use client";

import { useState } from "react";
import { getCategoryClass, getSeverityLabelClass } from "@/lib/reviewStyles";
import type { ReviewIssue } from "@/types/review";

interface IssueCardProps {
  issue: ReviewIssue;
  defaultOpen?: boolean;
}

export default function IssueCard({ issue, defaultOpen = false }: IssueCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/50">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-900/50 active:bg-zinc-900/70"
        aria-expanded={isOpen}
      >
        <span className="mt-0.5 shrink-0 font-mono text-xs text-zinc-500">
          L{issue.line}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-xs font-medium capitalize ${getSeverityLabelClass(issue.severity)}`}
            >
              {issue.severity}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${getCategoryClass(issue.category)}`}
            >
              {issue.category}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-zinc-300">{issue.description}</p>
        </div>

        <svg
          className={`mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Suggested fix
          </p>
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs leading-relaxed text-emerald-300">
            {issue.suggestedFix}
          </pre>
        </div>
      )}
    </div>
  );
}
