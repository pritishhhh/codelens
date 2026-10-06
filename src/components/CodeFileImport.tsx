"use client";

import { useRef, useState } from "react";
import { MAX_CODE_LENGTH } from "@/lib/constants";
import type { SupportedLanguage } from "@/types/language";

const extensionLanguages: Record<string, SupportedLanguage> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript", py: "python", java: "java",
  cpp: "cpp", cc: "cpp", c: "cpp", h: "cpp", hpp: "cpp", go: "go",
};

interface CodeFileImportProps {
  label?: string;
  disabled?: boolean;
  onImport: (code: string, language?: SupportedLanguage) => void;
}

export default function CodeFileImport({
  label = "Import file", disabled = false, onImport,
}: CodeFileImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    // UTF-8 can use four bytes per character; reject large files before reading them.
    if (file.size > MAX_CODE_LENGTH * 4) {
      setError("File is too large. Choose a snippet under 10,000 characters.");
      return;
    }
    setReading(true);
    try {
      const code = (await file.text()).replace(/\r\n?/g, "\n");
      if (code.includes("\0")) throw new Error("Choose a text source file, rather than a binary file.");
      if (code.length > MAX_CODE_LENGTH) throw new Error("File exceeds the 10,000 character limit.");
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      onImport(code, extensionLanguages[extension]);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not read this file.");
    } finally {
      setReading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef} type="file" className="hidden" aria-label={label}
        accept=".js,.jsx,.mjs,.cjs,.ts,.tsx,.py,.java,.cpp,.cc,.c,.h,.hpp,.go,.txt"
        onChange={importFile} disabled={disabled || reading}
      />
      <button type="button" className="tool-button" disabled={disabled || reading}
        onClick={() => inputRef.current?.click()}>
        {reading ? "Reading…" : label}
      </button>
      {error && <p role="alert" className="mt-2 max-w-xs text-xs text-red-400">{error}</p>}
    </div>
  );
}
