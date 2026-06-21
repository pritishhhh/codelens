import { getScoreColorClass } from "@/lib/reviewStyles";
import type { CompareResult, CompareSolutionAnalysis, CompareWinner } from "@/types/compare";

interface CompareResultsPanelProps {
  result: CompareResult;
}

function getWinnerLabel(winner: CompareWinner): string {
  switch (winner) {
    case "solutionA":
      return "Solution A wins";
    case "solutionB":
      return "Solution B wins";
    case "tie":
      return "It's a tie";
  }
}

function getWinnerBadgeClass(winner: CompareWinner): string {
  switch (winner) {
    case "solutionA":
      return "bg-indigo-950/60 text-indigo-300 border-indigo-800";
    case "solutionB":
      return "bg-violet-950/60 text-violet-300 border-violet-800";
    case "tie":
      return "bg-zinc-800/60 text-zinc-300 border-zinc-700";
  }
}

interface SolutionCardProps {
  label: string;
  analysis: CompareSolutionAnalysis;
  isWinner: boolean;
}

function SolutionCard({ label, analysis, isWinner }: SolutionCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isWinner ? "border-indigo-700 bg-indigo-950/20" : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-200">{label}</h4>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-bold ${getScoreColorClass(analysis.score)}`}
        >
          {analysis.score}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-emerald-500">
            Strengths
          </p>
          <ul className="space-y-1">
            {analysis.strengths.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-zinc-300">
                <span className="text-emerald-500" aria-hidden="true">
                  +
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-amber-500">
            Weaknesses
          </p>
          <ul className="space-y-1">
            {analysis.weaknesses.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-zinc-300">
                <span className="text-amber-500" aria-hidden="true">
                  −
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CompareResultsPanel({ result }: CompareResultsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span
          className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold sm:w-fit sm:justify-start ${getWinnerBadgeClass(result.winner)}`}
        >
          {getWinnerLabel(result.winner)}
        </span>

        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>
            A: <strong className="text-zinc-200">{result.solutionA.score}</strong>
          </span>
          <span className="text-zinc-600">vs</span>
          <span>
            B: <strong className="text-zinc-200">{result.solutionB.score}</strong>
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-zinc-300">{result.summary}</p>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Why this ranking
        </h3>
        <p className="text-sm leading-relaxed text-zinc-300">{result.reasoning}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SolutionCard
          label="Solution A"
          analysis={result.solutionA}
          isWinner={result.winner === "solutionA"}
        />
        <SolutionCard
          label="Solution B"
          analysis={result.solutionB}
          isWinner={result.winner === "solutionB"}
        />
      </div>
    </div>
  );
}
