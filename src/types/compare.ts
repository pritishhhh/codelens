export const COMPARE_WINNERS = ["solutionA", "solutionB", "tie"] as const;
export type CompareWinner = (typeof COMPARE_WINNERS)[number];

export interface CompareSolutionAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CompareResult {
  winner: CompareWinner;
  summary: string;
  reasoning: string;
  solutionA: CompareSolutionAnalysis;
  solutionB: CompareSolutionAnalysis;
}

export interface CompareRequestBody {
  solutionA: string;
  solutionB: string;
  language: string;
}

export interface CompareApiError {
  error: string;
}
