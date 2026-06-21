import type { Category, Severity } from "@/types/review";

export function getScoreColorClass(score: number): string {
  if (score < 50) return "text-red-400 bg-red-950/50 border-red-800";
  if (score <= 75) return "text-amber-400 bg-amber-950/50 border-amber-800";
  return "text-emerald-400 bg-emerald-950/50 border-emerald-800";
}

export function getScoreRingClass(score: number): string {
  if (score < 50) return "stroke-red-500";
  if (score <= 75) return "stroke-amber-500";
  return "stroke-emerald-500";
}

export function getSeverityLabelClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-950/60 text-red-400 border-red-800";
    case "major":
      return "bg-orange-950/60 text-orange-400 border-orange-800";
    case "minor":
      return "bg-amber-950/60 text-amber-400 border-amber-800";
    case "style":
      return "bg-zinc-800/60 text-zinc-400 border-zinc-700";
  }
}

export function getSeverityLineClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-950/40 border-l-red-500";
    case "major":
      return "bg-orange-950/30 border-l-orange-500";
    case "minor":
      return "bg-amber-950/20 border-l-amber-500";
    case "style":
      return "bg-zinc-800/30 border-l-zinc-600";
  }
}

export function getCategoryClass(category: Category): string {
  switch (category) {
    case "bug":
      return "bg-rose-950/50 text-rose-300";
    case "security":
      return "bg-purple-950/50 text-purple-300";
    case "performance":
      return "bg-sky-950/50 text-sky-300";
    case "readability":
      return "bg-teal-950/50 text-teal-300";
  }
}

export const SEVERITY_ORDER: Severity[] = ["critical", "major", "minor", "style"];

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  style: "Style",
};
