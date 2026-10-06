"use client";

import { useMemo, useState } from "react";
import { SEVERITY_LABELS, SEVERITY_ORDER } from "@/lib/reviewStyles";
import { CATEGORIES, type Category, type ReviewIssue, type ReviewResult, type Severity } from "@/types/review";
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
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Partial<Record<Severity, boolean>>>({});

  const filteredIssues = useMemo(() => review.issues.filter((issue) =>
    (category === "all" || issue.category === category) &&
    `${issue.description} ${issue.suggestedFix} ${issue.severity} ${issue.line}`.toLowerCase().includes(query.toLowerCase()),
  ), [review.issues, category, query]);
  const groupedIssues = useMemo(() => groupIssuesBySeverity(filteredIssues), [filteredIssues]);

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

      {review.issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" aria-label="Filter issues by category">
            {(["all", ...CATEGORIES] as const).map((item) => (
              <button key={item} type="button" aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`tool-button capitalize ${category === item ? "border-indigo-500 text-indigo-300" : ""}`}>
                {item === "all" ? "All issues" : item}
              </button>
            ))}
          </div>
          <label className="block text-xs text-zinc-400">
            Search issues
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search descriptions, fixes, or line numbers"
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500" />
          </label>
          <p className="text-xs text-zinc-500" role="status">
            Showing {filteredIssues.length} of {review.issues.length} issues
          </p>
        </div>
      )}
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
              aria-label="Diff view"
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

        <CodeDiffView code={code} issues={filteredIssues} showDiff={showDiff} />
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
      ) : filteredIssues.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 p-4 text-sm text-zinc-400">No issues match your filters.</p>
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
