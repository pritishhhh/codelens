"use client";

import { useState } from "react";
import { MAX_CODE_LENGTH } from "@/lib/constants";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/types/language";
import CodeEditorField from "./CodeEditorField";

export interface CodeInputSubmitPayload {
  code: string;
  language: SupportedLanguage;
}

interface CodeInputProps {
  onSubmit: (payload: CodeInputSubmitPayload) => void;
  isLoading?: boolean;
}

export default function CodeInput({ onSubmit, isLoading = false }: CodeInputProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCodeChange = (value: string) => {
    if (value.length > MAX_CODE_LENGTH) {
      setValidationError(`Code exceeds the ${MAX_CODE_LENGTH.toLocaleString()} character limit.`);
      return;
    }

    setValidationError(null);
    setCode(value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = code.trim();
    if (!trimmed) {
      setValidationError("Please paste some code before submitting.");
      return;
    }

    if (trimmed.length > MAX_CODE_LENGTH) {
      setValidationError(`Code exceeds the ${MAX_CODE_LENGTH.toLocaleString()} character limit.`);
      return;
    }

    setValidationError(null);
    onSubmit({ code: trimmed, language });
  };

  const charCount = code.length;
  const isNearLimit = charCount > MAX_CODE_LENGTH * 0.9;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="language" className="text-sm font-medium text-zinc-300">
          Language
        </label>
        <select
          id="language"
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

      <CodeEditorField
        id="code-editor"
        label="Code"
        value={code}
        language={language}
        onChange={handleCodeChange}
        disabled={isLoading}
        heightClass="h-[320px]"
      />

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
            {charCount.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()} characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Review Code"}
        </button>
      </div>
    </form>
  );
}
