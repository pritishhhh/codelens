import { diffLines } from "diff";

export interface DiffRow {
  kind: "added" | "removed" | "unchanged";
  text: string;
  oldLine: number | null;
  newLine: number | null;
}

export function buildLineDiff(before: string, after: string): DiffRow[] {
  let oldLine = 1;
  let newLine = 1;
  // Bound pathological, completely different snippets to keep typing responsive.
  const changes = diffLines(before, after, { timeout: 50 });
  const parts = changes ?? [
    { value: before, removed: true, added: false },
    { value: after, removed: false, added: true },
  ];
  return parts.flatMap((part) => {
    const lines = part.value.split("\n");
    if (lines.at(-1) === "") lines.pop();
    return lines.map((text): DiffRow => ({
      kind: part.added ? "added" : part.removed ? "removed" : "unchanged",
      text,
      oldLine: part.added ? null : oldLine++,
      newLine: part.removed ? null : newLine++,
    }));
  });
}
