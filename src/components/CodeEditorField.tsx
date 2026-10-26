"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
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
import { canFormat, formatCode } from "@/lib/formatCode";
import { downloadText } from "@/lib/download";

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
  "&": { backgroundColor: "#09090b" },
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
  const [wrap, setWrap] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [message, setMessage] = useState("");
  const [formatting, setFormatting] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const extensions = useMemo(() => [
    languages[language], editorTheme, indentUnit.of("  "), EditorState.tabSize.of(2),
    ...(wrap ? [EditorView.lineWrapping] : []),
    EditorView.theme({ ".cm-scroller": { fontSize: `${fontSize}px` } }),
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
  ], [id, label, language, wrap, fontSize]);

  const format = async () => {
    const view = viewRef.current;
    if (!view || disabled || formatting) return;
    const documentBefore = view.state.doc;
    const source = documentBefore.toString();
    setFormatting(true);
    setMessage("");
    try {
      const formatted = await formatCode(source, language);
      // Do not overwrite typing or an imported file while the parsers are loading.
      if (view.state.doc !== documentBefore) {
        setMessage("Code changed while formatting. Try again.");
      } else if (formatted.length > MAX_CODE_LENGTH) {
        setMessage("Formatted code exceeds the character limit. Source preserved.");
      } else {
        view.dispatch({ changes: { from: 0, to: source.length, insert: formatted }, userEvent: "input.format" });
        setMessage("Code formatted. Ctrl/Cmd+Z to undo.");
      }
    } catch {
      setMessage("Could not format this snippet. Check its syntax; source preserved.");
    } finally {
      setFormatting(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-zinc-300">{label}</label>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label={`${label} tools`}>
          {canFormat(language) && <button type="button" className="tool-button" disabled={disabled || formatting || !value}
            onClick={() => void format()}>{formatting ? "Formatting…" : "Format"}</button>}
          <button type="button" className="tool-button" disabled={!value} onClick={async () => {
            try { await navigator.clipboard.writeText(value); setMessage("Code copied."); }
            catch { setMessage("Clipboard unavailable. Select the code and copy it manually."); }
          }}>Copy</button>
          <button type="button" className="tool-button" disabled={!value} onClick={() => {
            const extensions = { javascript: "js", typescript: "ts", python: "py", java: "java", cpp: "cpp", go: "go" };
            downloadText(value, `${id}.${extensions[language]}`);
          }}>Download</button>
          <button type="button" className="tool-button" aria-pressed={wrap} onClick={() => setWrap(!wrap)}>Wrap lines</button>
          <label className="sr-only" htmlFor={`${id}-font-size`}>{label} font size</label>
          <select id={`${id}-font-size`} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}
            className="tool-button" aria-label={`${label} font size`}>
            {[12, 14, 16, 18].map((size) => <option key={size} value={size}>{size}px</option>)}
          </select>
        </div>
      </div>
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
          basicSetup={{ autocompletion: true, foldGutter: true }}
          onChange={(nextValue) => { setLimitError(false); onChange(nextValue); }}
          onCreateEditor={(view) => {
            viewRef.current = view;
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
      <p role="status" className="mt-1 text-xs text-indigo-300">{message}</p>
    </div>
  );
}
