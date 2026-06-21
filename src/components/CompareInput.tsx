"use client";

import { useState } from "react";
import { MAX_CODE_LENGTH } from "@/lib/constants";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/types/language";
import CodeEditorField from "./CodeEditorField";

export interface CompareInputSubmitPayload {
  solutionA: string;
  solutionB: string;
  language: SupportedLanguage;
}

interface CompareInputProps {
  onSubmit: (payload: CompareInputSubmitPayload) => void;
  isLoading?: boolean;
}

export default function CompareInput({ onSubmit, isLoading = false }: CompareInputProps) {
  const [solutionA, setSolutionA] = useState("");
  const [solutionB, setSolutionB] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateLength = (value: string, label: string): boolean => {
    if (value.length > MAX_CODE_LENGTH) {
      setValidationError(
        `${label} exceeds the ${MAX_CODE_LENGTH.toLocaleString()} character limit.`,
      );
      return false;
    }
    return true;
  };

  const handleSolutionAChange = (value: string) => {
    if (!validateLength(value, "Solution A")) return;
    setValidationError(null);
    setSolutionA(value);
  };

  const handleSolutionBChange = (value: string) => {
    if (!validateLength(value, "Solution B")) return;
    setValidationError(null);
    setSolutionB(value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedA = solutionA.trim();
    const trimmedB = solutionB.trim();

    if (!trimmedA || !trimmedB) {
      setValidationError("Please paste code into both Solution A and Solution B.");
      return;
    }

    if (trimmedA.length > MAX_CODE_LENGTH || trimmedB.length > MAX_CODE_LENGTH) {
      setValidationError(`Each solution must be under ${MAX_CODE_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setValidationError(null);
    onSubmit({ solutionA: trimmedA, solutionB: trimmedB, language });
  };

  const totalChars = solutionA.length + solutionB.length;
  const isNearLimit = totalChars > MAX_CODE_LENGTH * 1.8;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="compare-language" className="text-sm font-medium text-zinc-300">
          Language
        </label>
        <select
          id="compare-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
          disabled={isLoading}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditorField
          id="solution-a"
          label="Solution A"
          value={solutionA}
          language={language}
          onChange={handleSolutionAChange}
          disabled={isLoading}
          placeholder="Paste solution A..."
        />
        <CodeEditorField
          id="solution-b"
          label="Solution B"
          value={solutionB}
          language={language}
          onChange={handleSolutionBChange}
          disabled={isLoading}
          placeholder="Paste solution B..."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          {validationError && (
            <p role="alert" className="text-sm text-red-400">
              {validationError}
            </p>
          )}
          <p
            className={`text-xs ${isNearLimit ? "text-amber-400" : "text-zinc-500"}`}
            aria-live="polite"
          >
            {solutionA.length.toLocaleString()} + {solutionB.length.toLocaleString()} chars
            (max {MAX_CODE_LENGTH.toLocaleString()} each)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Comparing..." : "Compare Solutions"}
        </button>
      </div>
    </form>
  );
}
