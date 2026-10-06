import type { SupportedLanguage } from "@/types/language";
import { LANGUAGE_LABELS } from "@/types/language";
import type { ReviewResult } from "@/types/review";
import type { CompareResult } from "@/types/compare";

export type AnalysisReport = {
  kind: "review"; language: SupportedLanguage; code: string; result: ReviewResult;
} | {
  kind: "compare"; language: SupportedLanguage; solutionA: string; solutionB: string; result: CompareResult;
};

function codeBlock(code: string, language: string): string {
  // Source snippets may themselves contain Markdown fences.
  const longestFence = Math.max(0, ...(code.match(/`+/g) ?? []).map((match) => match.length));
  const fence = "`".repeat(Math.max(3, longestFence + 1));
  return `${fence}${language}\n${code}\n${fence}`;
}

export function reportToMarkdown(report: AnalysisReport): string {
  const lines = [
    `# CodeLens ${report.kind === "review" ? "Code Review" : "Solution Comparison"}`,
    "", `Language: ${LANGUAGE_LABELS[report.language]}`, "",
    report.result.summary, "",
  ];
  if (report.kind === "review") {
    lines.push(`Overall score: ${report.result.overallScore}/100`, "", "## Source", "",
      codeBlock(report.code, report.language), "", "## Issues", "");
    if (!report.result.issues.length) lines.push("No issues found.", "");
    for (const issue of report.result.issues) {
      lines.push(`### Line ${issue.line} · ${issue.severity} · ${issue.category}`,
        "", issue.description, "", "Suggested fix:", "", codeBlock(issue.suggestedFix, report.language), "");
    }
  } else {
    const { result } = report;
    const winner = result.winner === "tie" ? "Tie" : result.winner === "solutionA" ? "Solution A" : "Solution B";
    lines.push(`Winner: ${winner}`, "", "## Reasoning", "", result.reasoning, "");
    for (const [label, code, analysis] of [
      ["Solution A", report.solutionA, result.solutionA],
      ["Solution B", report.solutionB, result.solutionB],
    ] as const) {
      lines.push(`## ${label} · ${analysis.score}/100`, "", codeBlock(code, report.language), "",
        "### Strengths", "", ...analysis.strengths.map((item) => `- ${item}`), "",
        "### Weaknesses", "", ...analysis.weaknesses.map((item) => `- ${item}`), "");
    }
  }
  lines.push("---", "AI feedback can be incomplete or incorrect. Verify suggested changes before using them.");
  return lines.join("\n");
}
