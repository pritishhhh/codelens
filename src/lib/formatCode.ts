import type { SupportedLanguage } from "@/types/language";

export function canFormat(language: SupportedLanguage): boolean {
  return language === "javascript" || language === "typescript";
}

// Parsers are loaded only when requested, and source never leaves the browser.
export async function formatCode(code: string, language: SupportedLanguage): Promise<string> {
  if (!canFormat(language)) throw new Error("Formatting is available for JavaScript and TypeScript.");
  const [prettier, babel, estree, typescript] = await Promise.all([
    import("prettier/standalone"), import("prettier/plugins/babel"),
    import("prettier/plugins/estree"), import("prettier/plugins/typescript"),
  ]);
  return prettier.format(code, {
    parser: language === "typescript" ? "typescript" : "babel",
    plugins: [babel, estree, typescript], tabWidth: 2, printWidth: 88,
  });
}
