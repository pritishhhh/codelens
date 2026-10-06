"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { MAX_CODE_LENGTH } from "@/lib/constants";
import type { SupportedLanguage } from "@/types/language";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => <div className="h-full p-4 text-sm text-zinc-500">Loading editor…</div>,
});
const languages = {
  javascript: javascript({ jsx: true }),
  typescript: javascript({ typescript: true, jsx: true }),
  python: python(), java: java(), cpp: cpp(), go: go(),
};
const editorTheme = EditorView.theme({
  "&": { backgroundColor: "#09090b", fontSize: "14px" },
  ".cm-scroller": {
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace", lineHeight: "24px",
  },
  ".cm-content": { padding: "12px 0", fontVariantLigatures: "none" },
  ".cm-gutters": { backgroundColor: "#09090b", borderRight: "1px solid #27272a" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "#818cf8" },
});

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
  id, label, value, language, onChange, disabled = false,
  placeholder = "Paste your code here...", heightClass = "h-[280px]",
}: CodeEditorFieldProps) {
  const [position, setPosition] = useState({ line: 1, column: 1 });
  const [limitError, setLimitError] = useState(false);
  const extensions = useMemo(() => [
    languages[language], editorTheme, indentUnit.of("  "), EditorState.tabSize.of(2),
    EditorView.contentAttributes.of({
      id, "aria-label": label, "aria-describedby": `${id}-help`,
      spellcheck: "false", autocorrect: "off", autocapitalize: "off",
    }),
    // Enforce the limit before edits so the editor document and React stay in sync.
    EditorState.changeFilter.of((transaction) => transaction.newDoc.length <= MAX_CODE_LENGTH),
    EditorView.domEventHandlers({
      paste: (event, view) => {
        const text = event.clipboardData?.getData("text/plain").replace(/\r\n?/g, "\n");
        const selection = view.state.selection.main;
        if (text && view.state.doc.length - (selection.to - selection.from) + text.length > MAX_CODE_LENGTH) {
          event.preventDefault();
          setLimitError(true);
          return true;
        }
        return false;
      },
    }),
  ], [id, label, language]);

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-zinc-300">{label}</label>
      <div className={`overflow-hidden rounded-lg border border-zinc-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 ${heightClass}`}>
        <CodeMirror
          value={value}
          height="100%"
          className="h-full [&>.cm-editor]:h-full"
          theme="dark"
          extensions={extensions}
          editable={!disabled}
          readOnly={disabled}
          placeholder={placeholder}
          basicSetup={{ autocompletion: false, foldGutter: true }}
          onChange={(nextValue) => { setLimitError(false); onChange(nextValue); }}
          onCreateEditor={(view) => {
            // Remeasure after the local font loads to keep text and caret aligned.
            void document.fonts.ready.then(() => view.requestMeasure());
          }}
          onUpdate={(update) => {
            if (update.selectionSet || update.docChanged) {
              const head = update.state.selection.main.head;
              const line = update.state.doc.lineAt(head);
              setPosition({ line: line.number, column: head - line.from + 1 });
            }
          }}
        />
      </div>
      <div id={`${id}-help`} className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
        <span>Tab to indent · Escape, then Tab to leave · Ctrl/Cmd+Z to undo</span>
        <span>Ln {position.line}, Col {position.column}</span>
      </div>
      {limitError && <p role="alert" className="mt-2 text-sm text-red-400">Paste exceeds the {MAX_CODE_LENGTH.toLocaleString()} character limit.</p>}
    </div>
  );
}
