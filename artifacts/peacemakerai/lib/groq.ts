import type { CourtId } from "@/constants/courts";
import { COURT_PROMPTS } from "./prompts";
import type { ChatMessage } from "./storage";

const MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqError = { type: "no_key" | "api_error" | "safety_stop"; message: string };
export type GroqResult =
  | { ok: true; content: string; isSafetyStop: boolean }
  | { ok: false; error: GroqError };

export async function callJudge(
  courtId: CourtId,
  messages: ChatMessage[]
): Promise<GroqResult> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: {
        type: "no_key",
        message:
          "No Groq API key found. Add EXPO_PUBLIC_GROQ_API_KEY to your environment secrets.",
      },
    };
  }

  const systemPrompt = COURT_PROMPTS[courtId];

  const groqMessages = messages.map((m) => ({
    role: m.role === "judge" ? "assistant" : "user",
    content: m.content,
  }));

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
        max_tokens: 200,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        ok: false,
        error: { type: "api_error", message: `Groq API error ${res.status}: ${err}` },
      };
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    if (content.includes("SAFETY_STOP")) {
      return {
        ok: true,
        content: "SAFETY_STOP",
        isSafetyStop: true,
      };
    }

    return { ok: true, content: content.trim(), isSafetyStop: false };
  } catch (e) {
    return {
      ok: false,
      error: {
        type: "api_error",
        message: e instanceof Error ? e.message : "Network error",
      },
    };
  }
}
