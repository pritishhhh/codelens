import { NextResponse } from "next/server";
import { getAIProviderConfig } from "@/lib/aiProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { provider, label, model } = getAIProviderConfig();
    // Only public display metadata is returned; never expose keys or tokens.
    return NextResponse.json({ provider, label, model });
  } catch {
    return NextResponse.json({ error: "AI provider configuration is unavailable." }, { status: 503 });
  }
}
