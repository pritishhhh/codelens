"use client";

import { useMemo, useState } from "react";
import { SEVERITY_LABELS, SEVERITY_ORDER } from "@/lib/reviewStyles";
import type { ReviewIssue, ReviewResult, Severity } from "@/types/review";
import CodeDiffView from "./CodeDiffView";
import IssueCard from "./IssueCard";
import ScoreBadge from "./ScoreBadge";

interface ResultsPanelProps {
  review: ReviewResult;
  code: string;
}

function groupIssuesBySeverity(issues: ReviewIssue[]): Record<Severity, ReviewIssue[]> {
  const groups: Record<Severity, ReviewIssue[]> = {
    critical: [],
    major: [],
    minor: [],
    style: [],
  };

  for (const issue of issues) {
    groups[issue.severity].push(issue);
  }

  for (const severity of SEVERITY_ORDER) {
    groups[severity].sort((a, b) => a.line - b.line);
  }

  return groups;
}

export default function ResultsPanel({ review, code }: ResultsPanelProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Partial<Record<Severity, boolean>>>({});

  const groupedIssues = useMemo(() => groupIssuesBySeverity(review.issues), [review.issues]);

  const toggleGroup = (severity: Severity) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [severity]: !prev[severity],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ScoreBadge score={review.overallScore} />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-300 lg:pt-2">
          {review.summary}
        </p>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">
            Code review
            <span className="ml-2 font-normal text-zinc-500">
              ({review.issues.length} issue{review.issues.length === 1 ? "" : "s"})
            </span>
          </h3>

          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-sm text-zinc-400">Diff view</span>
            <button
              type="button"
              role="switch"
              aria-checked={showDiff}
              onClick={() => setShowDiff((value) => !value)}
              className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                showDiff ? "bg-indigo-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  showDiff ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        <CodeDiffView code={code} issues={review.issues} showDiff={showDiff} />
        <p className="mt-2 text-xs text-zinc-500">
          {showDiff
            ? "Showing original lines struck through with suggested fixes highlighted below."
            : "Issue lines are highlighted by severity. Toggle diff view to see suggested fixes inline."}
        </p>
      </div>

      {review.issues.length === 0 ? (
        <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4 text-center">
          <p className="text-sm text-emerald-400">No issues found — great work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Issues by severity</h3>

          {SEVERITY_ORDER.map((severity) => {
            const issues = groupedIssues[severity];
            if (issues.length === 0) return null;

            const isCollapsed = collapsedGroups[severity] ?? false;

            return (
              <div key={severity} className="overflow-hidden rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => toggleGroup(severity)}
                  className="flex w-full items-center justify-between bg-zinc-900/80 px-4 py-3 text-left transition hover:bg-zinc-900"
                  aria-expanded={!isCollapsed}
                >
                  <span className="text-sm font-medium text-zinc-200">
                    {SEVERITY_LABELS[severity]}
                    <span className="ml-2 text-zinc-500">({issues.length})</span>
                  </span>
                  <svg
                    className={`h-4 w-4 text-zinc-500 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {!isCollapsed && (
                  <div className="space-y-2 p-3">
                    {issues.map((issue, index) => (
                      <IssueCard
                        key={`${severity}-${issue.line}-${index}`}
                        issue={issue}
                        defaultOpen={severity === "critical" || severity === "major"}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
