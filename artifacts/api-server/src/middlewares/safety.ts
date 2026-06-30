import type { Request, Response, NextFunction } from "express";

type SafetyTrigger = "violence" | "abuse" | "child_endangerment" | "self_harm" | "threats";

const CHILD_TERMS = [
  "child abuse", "hurt my child", "hurt my kid", "touch my child",
  "molest my child", "abusing my child", "my child is in danger",
  "endanger", "endangering",
];
const VIOLENCE_TERMS = [
  "hit me", "hitting me", "beats me", "beat me", "hurts me", "punch",
  "choke", "strangle", "kicked me", "slapped me", "threw", "physical",
];
const ABUSE_TERMS = [
  "abuse", "abusing", "abused", "rape", "assault", "molest", "forced",
  "coerce", "coercion",
];
const SELF_HARM_TERMS = [
  "suicide", "kill myself", "harm myself", "self harm", "end my life",
  "don't want to live", "want to die",
];
const THREAT_TERMS = [
  "kill", "murder", "weapon", "knife", "gun", "shoot", "threaten",
  "threatened", "blackmail", "stalking", "stalker", "hostage",
  "scared for my life",
];

function checkSafety(text: string): { triggered: boolean; triggerType?: SafetyTrigger } {
  const lower = text.toLowerCase();
  if (CHILD_TERMS.some((t) => lower.includes(t))) return { triggered: true, triggerType: "child_endangerment" };
  if (VIOLENCE_TERMS.some((t) => lower.includes(t))) return { triggered: true, triggerType: "violence" };
  if (ABUSE_TERMS.some((t) => lower.includes(t))) return { triggered: true, triggerType: "abuse" };
  if (SELF_HARM_TERMS.some((t) => lower.includes(t))) return { triggered: true, triggerType: "self_harm" };
  if (THREAT_TERMS.some((t) => lower.includes(t))) return { triggered: true, triggerType: "threats" };
  return { triggered: false };
}

export function safetyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const content: unknown = req.body?.content;
  if (typeof content !== "string") { next(); return; }
  const result = checkSafety(content);
  if (result.triggered) {
    res.status(200).json({ safetyStop: true, triggerType: result.triggerType });
    return;
  }
  next();
}
