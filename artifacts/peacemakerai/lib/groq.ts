import type { CourtId } from "@/constants/courts";
import { apiFetch } from "@/lib/api";
import type { ChatMessage } from "@/context/CasesContext";

export type GroqError = { type: "no_key" | "api_error" | "safety_stop"; message: string };
export type GroqResult =
  | { ok: true; content: string; isSafetyStop: boolean }
  | { ok: false; error: GroqError };

export async function callJudge(
  _courtId: CourtId,
  caseId: string,
  userMessage: string
): Promise<GroqResult> {
  const res = await apiFetch<{ safetyStop: boolean; message?: ChatMessage }>(
    `/judge/${caseId}/message`,
    { method: "POST", body: JSON.stringify({ content: userMessage }) }
  );

  if (!res.ok) {
    return {
      ok: false,
      error: { type: "api_error", message: res.error },
    };
  }

  if (res.data.safetyStop) {
    return { ok: true, content: "SAFETY_STOP", isSafetyStop: true };
  }

  return {
    ok: true,
    content: res.data.message?.content ?? "",
    isSafetyStop: false,
  };
}
