import OpenAI from "openai";
import { DEFAULT_GROQ_MODEL, DEFAULT_OPENAI_MODEL } from "./constants";

export type AIProvider = "groq" | "openai";

export function getAIProviderConfig() {
  const provider = process.env.AI_PROVIDER?.trim() || "groq";
  if (provider !== "groq" && provider !== "openai") {
    throw new Error("Unsupported AI provider configuration.");
  }
  if (provider === "groq") {
    return {
      provider, label: "Groq", baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY?.trim(),
      model: process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
    } as const;
  }
  return {
    provider, label: "OpenAI", baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
  } as const;
}

export function createAIClient(config: ReturnType<typeof getAIProviderConfig>): OpenAI {
  if (!config.apiKey) throw new Error("Missing provider API key.");
  // Explicit keys and endpoints prevent the SDK from falling back to another
  // provider's credentials or OPENAI_BASE_URL in the process environment.
  return new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: 45_000, maxRetries: 0 });
}
