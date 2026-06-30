import type { Request, Response, NextFunction } from "express";

export type SafetyLevel = "authority_only" | "recommend_help" | "none";

// ── HARD STOP: active/immediate danger — no AI ruling, refer to authorities ─────────────────────
const CRISIS_TERMS = [
  "kill myself", "killing myself", "going to kill myself",
  "end my life", "take my life", "want to die right now",
  "suicide", "suicidal", "self harm", "self-harm", "harming myself", "cutting myself",
];
const CHILD_ABUSE_TERMS = [
  "child abuse", "abusing my child", "abusing my kid",
  "hurt my child", "hurt my kid", "hitting my child", "hitting my kid",
  "molest", "molesting", "touched inappropriately",
  "my child is in danger", "my kid is in danger",
  "child neglect", "child endangerment",
];
const SEXUAL_ASSAULT_TERMS = [
  "raped me", "raping me", "was raped", "sexually assaulted",
  "sexual assault", "sexually abused", "forced me to have sex", "forced sex",
];
const HOSTAGE_TERMS = [
  "hostage", "kidnapped", "kidnapping",
  "wont let me leave", "won't let me leave",
  "locked me in", "trapped me", "cant escape", "can't escape", "being held",
];
const ACTIVE_DANGER_TERMS = [
  "is hitting me", "is hurting me", "is beating me", "is choking me", "is strangling me",
  "he is attacking", "she is attacking", "being attacked right now",
  "has a gun", "has a knife", "pointing a gun", "pointing a knife", "holding a weapon",
  "scared for my life right now", "help me please",
];

// ── RECOMMEND HELP: concerning but not immediate crisis — court continues, resources shown ───────
const DOMESTIC_PATTERN_TERMS = [
  "has hit me before", "been hitting me", "hits me when", "used to hit me",
  "pattern of abuse", "history of abuse",
  "emotionally abusive", "emotionally abused",
  "controlling relationship", "coercive control",
  "financial abuse", "financially controlling",
  "isolated me", "isolating me", "cant see my friends", "can't see my friends",
];
const STALKING_TERMS = [
  "stalking me", "stalker", "following me everywhere",
  "tracking my phone", "spying on me", "showing up uninvited", "wont leave me alone",
];

function matchesAny(lower: string, terms: string[]): boolean {
  return terms.some((t) => lower.includes(t));
}

export function checkSafetyLevel(text: string): { level: SafetyLevel; category: string } {
  const lower = text.toLowerCase();
  if (matchesAny(lower, CRISIS_TERMS))         return { level: "authority_only", category: "self_harm" };
  if (matchesAny(lower, CHILD_ABUSE_TERMS))    return { level: "authority_only", category: "child_endangerment" };
  if (matchesAny(lower, SEXUAL_ASSAULT_TERMS)) return { level: "authority_only", category: "sexual_assault" };
  if (matchesAny(lower, HOSTAGE_TERMS))        return { level: "authority_only", category: "hostage_danger" };
  if (matchesAny(lower, ACTIVE_DANGER_TERMS))  return { level: "authority_only", category: "active_violence" };
  if (matchesAny(lower, DOMESTIC_PATTERN_TERMS)) return { level: "recommend_help", category: "domestic_pattern" };
  if (matchesAny(lower, STALKING_TERMS))       return { level: "recommend_help", category: "stalking" };
  return { level: "none", category: "" };
}

export function safetyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const content: unknown = req.body?.content;
  if (typeof content !== "string") { next(); return; }
  const result = checkSafetyLevel(content);
  if (result.level === "authority_only") {
    res.status(200).json({ safetyStop: true, safetyLevel: "authority_only", category: result.category });
    return;
  }
  if (result.level === "recommend_help") {
    res.locals.safetyRecommend = result.category;
  }
  next();
}
