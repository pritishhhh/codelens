"use client";

import { reportToMarkdown, type AnalysisReport } from "@/lib/reports";
import { downloadText } from "@/lib/download";

export default function ReportExport({ report }: { report: AnalysisReport }) {
  const download = (format: "md" | "json") => {
    const content = format === "md" ? reportToMarkdown(report) : JSON.stringify(report, null, 2);
    downloadText(content, `codelens-${report.kind}.${format}`, format === "md" ? "text/markdown;charset=utf-8" : "application/json");
  };

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
      <p className="text-xs text-zinc-500">AI feedback is a starting point. Verify suggested fixes.</p>
      <div className="flex gap-2">
        <button type="button" className="tool-button" onClick={() => download("md")}>Export Markdown</button>
        <button type="button" className="tool-button" onClick={() => download("json")}>Export JSON</button>
      </div>
    </div>
  );
}
