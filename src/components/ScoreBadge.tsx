import { getScoreColorClass, getScoreRingClass } from "@/lib/reviewStyles";

interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 sm:w-auto ${getScoreColorClass(score)}`}
      aria-label={`Overall score: ${score} out of 100`}
    >
      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-zinc-800"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={getScoreRingClass(score)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
          {score}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">Overall Score</p>
        <p className="text-sm font-semibold">
          {score < 50 ? "Needs work" : score <= 75 ? "Fair" : "Good"}
        </p>
      </div>
    </div>
  );
}
