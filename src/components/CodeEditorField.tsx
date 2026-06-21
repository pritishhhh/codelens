"use client";

import { useCallback, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { SYNTAX_HIGHLIGHTER_LANGUAGE, type SupportedLanguage } from "@/types/language";

const EDITOR_FONT_SIZE = "0.875rem";
const EDITOR_LINE_HEIGHT = "1.5rem";
const EDITOR_PADDING = "1rem";
const CURSOR_OFFSET_CH = 2;
const EDITOR_FONT_FAMILY = "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

const sharedEditorStyle = {
  margin: 0,
  padding: EDITOR_PADDING,
  fontSize: EDITOR_FONT_SIZE,
  lineHeight: EDITOR_LINE_HEIGHT,
  fontFamily: EDITOR_FONT_FAMILY,
  tabSize: 2,
  MozTabSize: 2,
  whiteSpace: "pre" as const,
  wordWrap: "normal" as const,
  overflowWrap: "normal" as const,
};

interface CodeEditorFieldProps {
  id: string;
  label: string;
  value: string;
  language: SupportedLanguage;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  heightClass?: string;
}

export default function CodeEditorField({
  id,
  label,
  value,
  language,
  onChange,
  disabled = false,
  placeholder = "Paste your code here...",
  heightClass = "h-[280px]",
}: CodeEditorFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Trailing newline keeps the caret aligned on the last line (matches textarea behavior).
  const highlightValue = value.length > 0 ? `${value}\n` : "\n ";

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <div
        className={`overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 ${heightClass}`}
      >
        <div className="relative h-full">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-auto"
          >
            <SyntaxHighlighter
              language={SYNTAX_HIGHLIGHTER_LANGUAGE[language]}
              style={oneDark}
              customStyle={{
                ...sharedEditorStyle,
                background: "transparent",
                minHeight: "100%",
              }}
              preTagProps={{
                style: {
                  ...sharedEditorStyle,
                  background: "transparent",
                },
              }}
              codeTagProps={{
                style: {
                  ...sharedEditorStyle,
                  background: "transparent",
                  fontFamily: EDITOR_FONT_FAMILY,
                },
              }}
            >
              {highlightValue}
            </SyntaxHighlighter>
          </div>

          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onScroll={syncScroll}
            disabled={disabled}
            placeholder={placeholder}
            spellCheck={false}
            wrap="off"
            className="absolute inset-0 z-10 block h-full w-full resize-none overflow-auto border-0 bg-transparent text-transparent outline-none ring-0 placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              ...sharedEditorStyle,
              paddingLeft: `calc(${EDITOR_PADDING} + ${CURSOR_OFFSET_CH}ch)`,
              caretColor: "#818cf8",
              WebkitTextFillColor: "transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
}
