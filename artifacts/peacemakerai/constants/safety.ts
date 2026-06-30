export type SafetyLevel = "authority_only" | "recommend_help" | "none";

export interface SafetyResult {
  level: SafetyLevel;
  category: string;
}

// ── Tier 1: HARD STOP — active/ongoing danger, no AI ruling, refer to authorities immediately ──────
const ACTIVE_DANGER_TERMS = [
  "call the police", "calling the police",
  "is hitting me", "is hurting me", "is beating me", "is choking me", "is strangling me",
  "right now", "help me please", "scared for my life",
  "has a gun", "has a knife", "pointing a gun", "pointing a knife",
  "holding a weapon", "threatening with a",
  "he is attacking", "she is attacking",
  "being attacked",
];

const CHILD_ABUSE_TERMS = [
  "child abuse", "abusing my child", "abusing my kid",
  "hurt my child", "hurt my kid", "hitting my child", "hitting my kid",
  "molest", "molesting", "touched inappropriately",
  "my child is in danger", "my kid is in danger",
  "child neglect", "neglecting the children", "leaving the kids alone",
  "child endangerment",
];

const SEXUAL_ASSAULT_TERMS = [
  "raped me", "raping me", "was raped", "sexually assaulted",
  "sexual assault", "sexually abused", "forced me to have sex",
  "forced sex",
];

const CRISIS_TERMS = [
  "kill myself", "killing myself", "going to kill myself",
  "end my life", "take my life", "want to die right now",
  "suicide", "suicidal", "self harm", "self-harm", "harming myself",
  "cutting myself",
];

const HOSTAGE_TERMS = [
  "hostage", "kidnapped", "kidnapping", "wont let me leave", "won't let me leave",
  "locked me in", "trapped me", "cant escape", "can't escape",
  "being held",
];

// ── Tier 2: RECOMMEND HELP — concerning but not immediate crisis, court continues with resources ──
const DOMESTIC_PATTERN_TERMS = [
  "he always hits", "she always hits",
  "been hitting me", "hits me when", "used to hit me", "has hit me before",
  "pattern of abuse", "history of abuse",
  "emotionally abusive", "emotionally abused",
  "controlling relationship", "he controls", "she controls everything",
  "financial abuse", "financially controlling",
  "coercive control", "isolated me", "isolating me",
  "can't see my friends", "won't let me see",
  "mental abuse", "mentally abusive",
];

const STALKING_TERMS = [
  "stalking me", "stalker", "following me everywhere",
  "tracking my phone", "spying on me", "hacked my phone",
  "showing up uninvited", "wont leave me alone", "won't leave me alone",
];

// ── Tier 3: SCHOOL/YOUTH PHYSICAL (AI handles educationally — NOT authority_only) ────────────────
// These terms in a school/youth context → AI educates. In adult context → may escalate.
export const SCHOOL_CONFLICT_TERMS = [
  "got in a fight", "had a fight", "we fought",
  "pushed me", "pushed him", "pushed her",
  "hit him", "hit her", "hit them",
  "they hit me", "they punched me",
  "school fight", "after school fight",
  "bullying", "being bullied", "bully",
];

function checkTerms(lower: string, terms: string[]): boolean {
  return terms.some((t) => lower.includes(t));
}

export function detectSafety(text: string, courtType?: string): SafetyResult {
  const lower = text.toLowerCase();

  // Tier 1 — always hard stop regardless of court type
  if (checkTerms(lower, CRISIS_TERMS)) {
    return { level: "authority_only", category: "self_harm" };
  }
  if (checkTerms(lower, CHILD_ABUSE_TERMS)) {
    return { level: "authority_only", category: "child_endangerment" };
  }
  if (checkTerms(lower, SEXUAL_ASSAULT_TERMS)) {
    return { level: "authority_only", category: "sexual_assault" };
  }
  if (checkTerms(lower, HOSTAGE_TERMS)) {
    return { level: "authority_only", category: "hostage_danger" };
  }
  if (checkTerms(lower, ACTIVE_DANGER_TERMS)) {
    return { level: "authority_only", category: "active_violence" };
  }

  // Youth court (school_*) — school conflict terms pass through to AI for educational handling
  const isYouthCourt = courtType?.startsWith("school_") || courtType === "school";
  if (!isYouthCourt && checkTerms(lower, SCHOOL_CONFLICT_TERMS)) {
    // Adult describing past physical altercation → recommend professional help but court continues
    return { level: "recommend_help", category: "past_physical" };
  }

  // Tier 2 — recommend help but court continues
  if (checkTerms(lower, DOMESTIC_PATTERN_TERMS)) {
    return { level: "recommend_help", category: "domestic_pattern" };
  }
  if (checkTerms(lower, STALKING_TERMS)) {
    return { level: "recommend_help", category: "stalking" };
  }

  return { level: "none", category: "" };
}

// Legacy compatibility
export const DANGER_KEYWORDS: string[] = [
  ...ACTIVE_DANGER_TERMS,
  ...CHILD_ABUSE_TERMS,
  ...SEXUAL_ASSAULT_TERMS,
  ...CRISIS_TERMS,
  ...HOSTAGE_TERMS,
];

export function detectDanger(text: string): boolean {
  return detectSafety(text).level === "authority_only";
}
