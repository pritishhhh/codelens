"use client";

import { useMemo } from "react";
import { buildLineDiff } from "@/lib/lineDiff";

export default function SourceDiff({ before, after }: { before: string; after: string }) {
  const rows = useMemo(() => buildLineDiff(before, after), [before, after]);
  const added = rows.filter((row) => row.kind === "added").length;
  const removed = rows.filter((row) => row.kind === "removed").length;
  return (
    <details className="rounded-lg border border-zinc-800 bg-zinc-950/60" open>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">
        Source diff <span className="ml-2 text-xs text-zinc-400">A → B · {added} added · {removed} removed</span>
      </summary>
      {before === after ? <p className="px-4 pb-4 text-sm text-zinc-400">The two solutions are identical.</p> : (
        <div className="max-h-80 overflow-auto border-t border-zinc-800" tabIndex={0} role="region" aria-label="Source differences">
          <table className="w-full border-collapse font-mono text-xs leading-6">
            <caption className="sr-only">Changes from Solution A to Solution B. Minus marks removals; plus marks additions.</caption>
            <thead className="sr-only"><tr><th>A line</th><th>B line</th><th>Change</th><th>Source</th></tr></thead>
            <tbody>{rows.map((row, index) => (
              <tr key={index} className={row.kind === "added" ? "bg-emerald-950/40 text-emerald-200" : row.kind === "removed" ? "bg-red-950/40 text-red-200" : "text-zinc-400"}>
                <td className="w-10 select-none px-2 text-right text-zinc-400">{row.oldLine}</td>
                <td className="w-10 select-none border-r border-zinc-800 px-2 text-right text-zinc-400">{row.newLine}</td>
                <td className="w-6 px-2">{row.kind === "added" ? "+" : row.kind === "removed" ? "−" : " "}</td>
                <td className="whitespace-pre pr-4">{row.text || " "}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="px-4 py-2 text-xs text-zinc-400">Computed on this device. No AI request needed.</p>
    </details>
  );
}
