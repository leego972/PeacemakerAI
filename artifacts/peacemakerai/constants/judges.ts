export type JudgeId = "dorothy" | "james" | "maggie" | "karl" | "edward";

export type JudgeDefinition = {
  id: JudgeId;
  name: string;
  title: string;
  image: number;
  tagline: string;
};

export const JUDGES: Record<JudgeId, JudgeDefinition> = {
  dorothy: {
    id: "dorothy",
    name: "Judge Dorothy",
    title: "Senior Justice, People's Court",
    image: require("../assets/images/judge-dorothy.png"),
    tagline: "I've seen it all. Don't waste my time.",
  },
  james: {
    id: "james",
    name: "Judge James",
    title: "His Honour, Barrister at Law",
    image: require("../assets/images/judge-james.png"),
    tagline: "The record speaks. So shall the truth.",
  },
  maggie: {
    id: "maggie",
    name: "Judge Maggie",
    title: "Associate Justice, Circuit Court",
    image: require("../assets/images/judge-maggie.png"),
    tagline: "I am noting everything. Everything.",
  },
  karl: {
    id: "karl",
    name: "Judge Karl",
    title: "Honourable Justice, Community Bench",
    image: require("../assets/images/judge-karl.png"),
    tagline: "Before we proceed — what are you really trying to say?",
  },
  edward: {
    id: "edward",
    name: "Judge Edward",
    title: "Justice, District Court",
    image: require("../assets/images/judge-edward.png"),
    tagline: "I've heard a lot of stories. Make yours worth my time.",
  },
};

export const JUDGE_ORDER: JudgeId[] = ["dorothy", "james", "maggie", "karl", "edward"];

/**
 * Deterministically picks a judge from a case ID using a simple char-code hash.
 * Both client and server use this same algorithm so they always agree.
 */
export function pickJudgeId(caseId: string): JudgeId {
  let hash = 0;
  for (let i = 0; i < caseId.length; i++) {
    hash = (hash * 31 + caseId.charCodeAt(i)) >>> 0;
  }
  return JUDGE_ORDER[hash % JUDGE_ORDER.length];
}

export function getJudge(caseId: string): JudgeDefinition {
  return JUDGES[pickJudgeId(caseId)];
}
