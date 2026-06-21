"use client";

import { getSeverityLineClass } from "@/lib/reviewStyles";
import type { ReviewIssue, Severity } from "@/types/review";

interface CodeDiffViewProps {
  code: string;
  issues: ReviewIssue[];
  showDiff: boolean;
}

interface LineAnnotation {
  issues: ReviewIssue[];
  highestSeverity: Severity;
}

function getHighestSeverity(issues: ReviewIssue[]): Severity {
  const order: Severity[] = ["critical", "major", "minor", "style"];
  for (const severity of order) {
    if (issues.some((issue) => issue.severity === severity)) {
      return severity;
    }
  }
  return "style";
}

function buildLineMap(issues: ReviewIssue[]): Map<number, LineAnnotation> {
  const map = new Map<number, LineAnnotation>();

  for (const issue of issues) {
    const existing = map.get(issue.line);
    if (existing) {
      existing.issues.push(issue);
      existing.highestSeverity = getHighestSeverity(existing.issues);
    } else {
      map.set(issue.line, {
        issues: [issue],
        highestSeverity: issue.severity,
      });
    }
  }

  return map;
}

export default function CodeDiffView({ code, issues, showDiff }: CodeDiffViewProps) {
  const lines = code.split("\n");
  const lineMap = buildLineMap(issues);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="-mx-px overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[min(100%,320px)] border-collapse font-mono text-xs sm:text-sm">
          <tbody>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const annotation = lineMap.get(lineNumber);

              if (!annotation) {
                return (
                  <tr key={lineNumber} className="leading-6">
                    <td className="sticky left-0 select-none border-r border-zinc-800 bg-zinc-950 px-2 py-0.5 text-right text-xs text-zinc-600 sm:px-3">
                      {lineNumber}
                    </td>
                    <td className="whitespace-pre px-4 py-0.5 text-zinc-300">{line || " "}</td>
                  </tr>
                );
              }

              const severityClass = getSeverityLineClass(annotation.highestSeverity);

              return (
                <tr key={lineNumber} className="leading-6">
                  <td
                    className={`sticky left-0 select-none border-r border-zinc-800 bg-zinc-950 px-2 py-0.5 text-right text-xs text-zinc-500 sm:px-3 ${severityClass}`}
                  >
                    {lineNumber}
                  </td>
                  <td className={`px-0 py-0.5 ${severityClass} border-l-2`}>
                    <div className="px-4 py-0.5">
                      {showDiff ? (
                        <div className="space-y-1">
                          <div className="whitespace-pre text-zinc-500 line-through decoration-red-500/60">
                            {line || " "}
                          </div>
                          {annotation.issues.map((issue, issueIndex) => (
                            <div
                              key={`${lineNumber}-${issueIndex}`}
                              className="whitespace-pre rounded bg-emerald-950/40 px-2 py-1 text-emerald-300"
                            >
                              {issue.suggestedFix}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-pre text-zinc-200">{line || " "}</div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
