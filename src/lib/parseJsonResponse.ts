/**
 * Extracts a JSON object string from model output that may include markdown fences or prose.
 */
export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export function parseJsonObject(raw: string): unknown {
  const jsonText = extractJsonObject(raw);
  return JSON.parse(jsonText) as unknown;
}
