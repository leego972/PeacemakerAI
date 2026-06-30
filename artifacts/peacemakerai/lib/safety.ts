import { DANGER_KEYWORDS } from "@/constants/safety";

export type SafetyTrigger =
  | "violence"
  | "abuse"
  | "child_endangerment"
  | "self_harm"
  | "threats";

export interface SafetyCheck {
  triggered: boolean;
  triggerType?: SafetyTrigger;
}

const VIOLENCE_TERMS = [
  "hit me", "hitting me", "beats me", "beat me", "hurts me", "punch",
  "choke", "strangle", "kicked me", "slapped me", "threw", "physical",
];
const ABUSE_TERMS = [
  "abuse", "abusing", "abused", "rape", "assault", "molest", "forced",
  "coerce", "coercion",
];
const CHILD_TERMS = [
  "child abuse", "hurt my child", "hurt my kid", "touch my child",
  "molest my child", "abusing my child", "my child is in danger",
  "endanger", "endangering",
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

export function checkSafety(text: string): SafetyCheck {
  const lower = text.toLowerCase();

  if (CHILD_TERMS.some((t) => lower.includes(t))) {
    return { triggered: true, triggerType: "child_endangerment" };
  }
  if (VIOLENCE_TERMS.some((t) => lower.includes(t))) {
    return { triggered: true, triggerType: "violence" };
  }
  if (ABUSE_TERMS.some((t) => lower.includes(t))) {
    return { triggered: true, triggerType: "abuse" };
  }
  if (SELF_HARM_TERMS.some((t) => lower.includes(t))) {
    return { triggered: true, triggerType: "self_harm" };
  }
  if (THREAT_TERMS.some((t) => lower.includes(t))) {
    return { triggered: true, triggerType: "threats" };
  }

  return { triggered: false };
}

export function getSafetyMessage(type?: SafetyTrigger): string {
  switch (type) {
    case "child_endangerment":
      return "This court cannot proceed — a child may be in danger. Please contact emergency services or a child protection agency immediately.";
    case "violence":
      return "This court cannot proceed when physical safety is at risk. Please reach out to a crisis service right away.";
    case "abuse":
      return "This court cannot continue — abuse is a serious matter that requires real human support, not an AI judge.";
    case "self_harm":
      return "This court is pausing — your safety matters most. Please reach out to a crisis line right now.";
    case "threats":
      return "This court cannot proceed when threats are involved. If you're in immediate danger, call 911.";
    default:
      return "This court has stopped because the situation described requires real human support. Please use the resources below.";
  }
}
