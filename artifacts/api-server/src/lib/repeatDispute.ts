type ExistingCase = {
  id: string;
  title: string;
  openingArgument: string;
  courtType: string;
  status: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type RepeatDisputeResult = {
  repeated: boolean;
  reason?: string;
  existingCaseId?: string;
  existingStatus?: string;
  similarity?: number;
};

const ACTIVE_STATUSES = new Set([
  "pending_response",
  "in_session",
  "awaiting_fair_call",
]);

const CLOSED_STATUSES = new Set([
  "resolved",
  "declined",
  "expired",
  "dismissed",
  "one_sided_verdict",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|and|or|but|because|about|with|that|this|they|them|their|there|then|when|where|what|why|how|was|were|are|is|to|of|for|in|on|at|by|from|my|me|i|you|your|he|she|we|our)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length >= 3));
}

function jaccardSimilarity(a: string, b: string): number {
  const aSet = tokenSet(a);
  const bSet = tokenSet(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function isSameTitle(a: string, b: string): boolean {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);
  if (!normalizedA || !normalizedB) return false;
  return normalizedA === normalizedB || jaccardSimilarity(normalizedA, normalizedB) >= 0.82;
}

function isSameOpening(a: string, b: string): number {
  return jaccardSimilarity(a, b);
}

/**
 * Prevents repeat hearings for the same dispute between the same linked users.
 * This protects respondents from pressure-spam and prevents judge/verdict shopping.
 * A genuinely new incident should be filed with materially new facts, dates, and context.
 */
export function findRepeatDispute(input: {
  courtType: string;
  title: string;
  openingArgument: string;
  existingCases: ExistingCase[];
}): RepeatDisputeResult {
  const sameCourtTypeCases = input.existingCases.filter((existing) => existing.courtType === input.courtType);

  for (const existing of sameCourtTypeCases) {
    const titleMatch = isSameTitle(input.title, existing.title);
    const openingSimilarity = isSameOpening(input.openingArgument, existing.openingArgument);
    const repeated = titleMatch || openingSimilarity >= 0.74;

    if (!repeated) continue;

    if (ACTIVE_STATUSES.has(existing.status)) {
      return {
        repeated: true,
        existingCaseId: existing.id,
        existingStatus: existing.status,
        similarity: openingSimilarity,
        reason: "A highly similar dispute is already active between these people. Continue that case instead of filing another summons.",
      };
    }

    if (CLOSED_STATUSES.has(existing.status)) {
      return {
        repeated: true,
        existingCaseId: existing.id,
        existingStatus: existing.status,
        similarity: openingSimilarity,
        reason: "A highly similar dispute has already been handled between these people. PeacemakerAI does not allow repeated hearings for the same argument or verdict-shopping.",
      };
    }
  }

  return { repeated: false };
}
