"use client";

import { useState } from "react";
import { MAX_CODE_LENGTH } from "@/lib/constants";
import { usePersistentDraft } from "@/hooks/usePersistentDraft";
import { EMPTY_COMPARE_DRAFT, isCompareDraft } from "@/lib/drafts";
import { COMPARE_EXAMPLES } from "@/lib/examples";
import { SAMPLE_COMPARISON } from "@/lib/sampleReports";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/types/language";
import CodeEditorField from "./CodeEditorField";
import CodeFileImport from "./CodeFileImport";
import SourceDiff from "./SourceDiff";

export interface CompareInputSubmitPayload {
  solutionA: string;
  solutionB: string;
  language: SupportedLanguage;
}

interface CompareInputProps {
  onSubmit: (payload: CompareInputSubmitPayload) => void;
  isLoading?: boolean;
  onSample: (payload: CompareInputSubmitPayload) => void;
  providerLabel: string;
}

export default function CompareInput({ onSubmit, onSample, providerLabel, isLoading = false }: CompareInputProps) {
  const { draft, setDraft, ready, storageAvailable, persistenceEnabled, setPersistenceEnabled, saving } = usePersistentDraft(
    "codelens:compare-draft:v1", EMPTY_COMPARE_DRAFT, isCompareDraft,
  );
  const { solutionA, solutionB, language } = draft;
  const setSolutionA = (value: string) => setDraft((previous) => ({ ...previous, solutionA: value }));
  const setSolutionB = (value: string) => setDraft((previous) => ({ ...previous, solutionB: value }));
  const setLanguage = (value: SupportedLanguage) => setDraft((previous) => ({ ...previous, language: value }));
  const inputsDisabled = isLoading || !ready;
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
    onSubmit({ solutionA, solutionB, language });
  };

  const totalChars = solutionA.length + solutionB.length;
  const isNearLimit = totalChars > MAX_CODE_LENGTH * 1.8;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" onKeyDownCapture={(event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !inputsDisabled) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.requestSubmit();
      }
    }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="compare-language" className="text-sm font-medium text-zinc-300">
          Language
        </label>
        <select
          id="compare-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
          disabled={inputsDisabled}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="tool-button" disabled={inputsDisabled} onClick={() => {
          const sample = { solutionA: SAMPLE_COMPARISON[0], solutionB: SAMPLE_COMPARISON[1], language: "typescript" as const };
          setDraft(sample); setValidationError(null); onSample(sample);
        }}>View sample comparison</button>
        <button type="button" className="tool-button" disabled={inputsDisabled}
          onClick={() => {
            const [exampleA, exampleB] = COMPARE_EXAMPLES[language];
            setDraft({ solutionA: exampleA, solutionB: exampleB, language });
            setValidationError(null);
          }}>Load examples</button>
        <button type="button" className="tool-button" disabled={inputsDisabled || (!solutionA && !solutionB)}
          onClick={() => setDraft((previous) => ({
            ...previous, solutionA: previous.solutionB, solutionB: previous.solutionA,
          }))}>Swap solutions</button>
        <button type="button" className="tool-button" disabled={inputsDisabled || (!solutionA && !solutionB)}
          onClick={() => {
            setDraft({ solutionA: "", solutionB: "", language });
            setValidationError(null);
          }}>Clear solutions</button>
        <span className="text-xs text-zinc-500">Examples replace both snippets.</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <CodeFileImport label="Import Solution A" disabled={inputsDisabled} onImport={(code, detected) => {
          setValidationError(null);
          setDraft((previous) => ({
            ...previous, solutionA: code, language: previous.solutionB ? previous.language : detected ?? previous.language,
          }));
        }} />
        <CodeFileImport label="Import Solution B" disabled={inputsDisabled} onImport={(code, detected) => {
          setValidationError(null);
          setDraft((previous) => ({
            ...previous, solutionB: code, language: previous.solutionA ? previous.language : detected ?? previous.language,
          }));
        }} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditorField
          id="solution-a"
          label="Solution A"
          value={solutionA}
          language={language}
          onChange={handleSolutionAChange}
          disabled={inputsDisabled}
          placeholder="Paste solution A..."
        />
        <CodeEditorField
          id="solution-b"
          label="Solution B"
          value={solutionB}
          language={language}
          onChange={handleSolutionBChange}
          disabled={inputsDisabled}
          placeholder="Paste solution B..."
        />
      </div>

      {(solutionA || solutionB) && <SourceDiff before={solutionA} after={solutionB} />}

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
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={persistenceEnabled} disabled={!ready} onChange={(event) => setPersistenceEnabled(event.target.checked)} className="accent-indigo-500" />
            Save comparison on this device
          </label>
          <p className="text-xs text-zinc-400" role="status">
            {!storageAvailable ? "Draft storage unavailable; keep a copy before closing." : persistenceEnabled ? saving ? "Saving drafts…" : "Drafts saved on this device." : "Drafts stay in memory. Enable saving to restore them after reload."}
          </p>
        </div>

        <button
          type="submit"
          disabled={inputsDisabled || !solutionA.trim() || !solutionB.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Comparing..." : "Compare Solutions"}
        </button>
      </div>
      <p className="text-xs text-zinc-500">Ctrl/Cmd+Enter to compare. Submitted code is sent to {providerLabel}; avoid secrets and private credentials.</p>
    </form>
  );
}
