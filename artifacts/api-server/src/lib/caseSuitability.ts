export type CaseSuitabilityCategory =
  | "safety"
  | "public_figure"
  | "legal"
  | "money"
  | "parenting"
  | "property"
  | "professional";

export type CaseSuitabilityResult = {
  suitable: boolean;
  category?: CaseSuitabilityCategory;
  reason?: string;
  redirect?: string;
  matchedTerm?: string;
};

type Rule = {
  category: CaseSuitabilityCategory;
  terms: string[];
  reason: string;
  redirect: string;
};

const RULES: Rule[] = [
  {
    category: "safety",
    terms: [
      "domestic violence", "family violence", "hit me", "beats me", "beat me", "choked", "strangled",
      "threatened me", "weapon", "knife", "gun", "stalking", "stalker", "blackmail", "extortion",
      "rape", "sexual assault", "molest", "child abuse", "child endangerment", "self harm",
      "suicide", "kill myself", "want to die", "scared for my life", "afraid for my safety",
    ],
    reason: "This case appears to involve safety risk, abuse, threats, child safety, or self-harm. PeacemakerAI cannot run a hearing on this matter.",
    redirect: "Show safety resources and encourage immediate local emergency or crisis support where appropriate.",
  },
  {
    category: "public_figure",
    terms: [
      "celebrity", "famous person", "public figure", "influencer", "creator", "streamer",
      "youtuber", "youtube", "tiktok", "instagram", "twitter", "x.com", "journalist",
      "politician", "prime minister", "president", "public statement", "public post",
      "went viral", "viral video", "cancel", "call out", "put them on trial", "summon them publicly",
      "@",
    ],
    reason: "This case appears to target a public figure, public statement, public handle, or online content. PeacemakerAI is for voluntary private disputes between people who know each other, not public trials or pile-ons.",
    redirect: "Do not send a summons. Offer a private reflection or public-statement review only if it avoids naming, shaming, legal conclusions, or verdicts against a real person.",
  },
  {
    category: "legal",
    terms: [
      "court order", "intervention order", "restraining order", "avo", "apprehended violence order",
      "lawsuit", "sue", "suing", "lawyer", "solicitor", "attorney", "legal action",
      "criminal charge", "police matter", "police report", "bail", "probation", "parole",
      "defamation", "immigration", "eviction", "tenant tribunal", "tribunal", "contract dispute",
    ],
    reason: "This case appears to involve a legal, court, police, tribunal, or contract matter. PeacemakerAI only handles everyday non-binding fairness disputes.",
    redirect: "Suggest a qualified lawyer, legal aid, court service, police, or official dispute-resolution body.",
  },
  {
    category: "parenting",
    terms: [
      "custody", "visitation", "parenting order", "parenting orders", "parenting arrangement",
      "parenting arrangements", "child support", "supervised visit", "supervised visitation",
      "who gets the child", "who gets my child", "who gets the kids", "take the kids",
      "keep the kids", "fit parent", "unsafe parent", "neglect", "abusing the child",
    ],
    reason: "This case appears to involve custody, parenting orders, child support, or child-safety decisions. PeacemakerAI cannot decide those matters.",
    redirect: "Suggest a family lawyer, accredited mediator, court service, child-safety authority, or emergency service if safety is involved.",
  },
  {
    category: "money",
    terms: [
      "$", "aud", "usd", "owed me", "owes me", "owe me", "loan", "debt", "rent owed",
      "refund", "compensation", "damages", "invoice", "unpaid", "salary", "wages",
      "business dispute", "inheritance", "tax", "contract payment",
    ],
    reason: "This case appears to involve money, debt, compensation, rent, contracts, tax, wages, or financial liability. PeacemakerAI cannot rule on financial/legal entitlement.",
    redirect: "Suggest a lawyer, accountant, financial adviser, consumer agency, tenancy body, or small-claims/civil dispute pathway.",
  },
  {
    category: "property",
    terms: [
      "who owns", "ownership", "shared property", "property settlement", "asset", "assets",
      "car title", "house title", "lease agreement", "bond dispute", "security deposit",
    ],
    reason: "This case appears to involve property ownership, lease, bond, or asset entitlement. PeacemakerAI cannot decide property rights.",
    redirect: "Suggest legal advice, tenancy advice, consumer affairs, or the relevant official dispute body.",
  },
  {
    category: "professional",
    terms: [
      "medical advice", "diagnosis", "therapy", "therapist", "psychologist", "psychiatrist",
      "medication", "tax advice", "investment advice", "financial advice",
    ],
    reason: "This case appears to require professional medical, mental-health, tax, investment, or financial advice. PeacemakerAI cannot provide that.",
    redirect: "Suggest a qualified professional or official support service.",
  },
];

function normalise(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function checkCaseSuitability(input: {
  courtType?: string;
  title?: string;
  openingArgument?: string;
  respondentStatement?: string;
  content?: string;
}): CaseSuitabilityResult {
  const text = [
    input.courtType,
    input.title,
    input.openingArgument,
    input.respondentStatement,
    input.content,
  ].map(normalise).join("\n");

  for (const rule of RULES) {
    const matchedTerm = rule.terms.find((term) => text.includes(term));
    if (matchedTerm) {
      return {
        suitable: false,
        category: rule.category,
        reason: rule.reason,
        redirect: rule.redirect,
        matchedTerm,
      };
    }
  }

  return { suitable: true };
}
