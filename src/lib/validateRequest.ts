import { MAX_CODE_LENGTH } from "./constants";
import { RequestError } from "./apiSupport";
import { isSupportedLanguage, type SupportedLanguage } from "@/types/language";

export function requestObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RequestError("Request body must be a JSON object.", 400);
  }
  return value as Record<string, unknown>;
}

export function requestCode(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new RequestError(`${field} must be a non-empty string.`, 400);
  if (value.length > MAX_CODE_LENGTH) throw new RequestError(`${field} exceeds the maximum length of ${MAX_CODE_LENGTH} characters.`, 400);
  return value;
}

export function requestLanguage(value: unknown): SupportedLanguage {
  if (typeof value !== "string" || !isSupportedLanguage(value)) throw new RequestError("language must be a supported language.", 400);
  return value;
}
