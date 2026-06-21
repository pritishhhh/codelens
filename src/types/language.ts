export const SUPPORTED_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "go",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  go: "Go",
};

export const SYNTAX_HIGHLIGHTER_LANGUAGE: Record<SupportedLanguage, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  cpp: "cpp",
  go: "go",
};
