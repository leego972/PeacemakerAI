export type AgeBracket = "under_13" | "teen_13_17" | "adult_18plus";
export type RelationshipStatus =
  | "dating" | "engaged" | "married" | "separated" | "divorced"
  | "friend" | "classmates" | "coworkers" | "group";

export interface IntakeFormData {
  ageBracket: AgeBracket;
  otherPartyDescription: string;
  relationshipStatus: RelationshipStatus;
  durationKnown: string;
  hasChildren: boolean;
  childrenInfo: string;
  background: string;
  incident: string;
  incidentWhen: string;
  desiredOutcome: string;
}

export interface AdmissionsResult {
  admitted: boolean;
  ruling: string;
  courtType: string;
  ageCategory: "child" | "teen" | "adult";
  focus: string;
}

function ageLabel(bracket: AgeBracket): string {
  if (bracket === "under_13") return "Under 13 years old";
  if (bracket === "teen_13_17") return "13-17 years old (teen)";
  return "18 or over (adult)";
}

function durationLabel(d: string): string {
  const map: Record<string, string> = {
    less_3mo: "less than 3 months",
    "3_12mo": "3-12 months",
    "1_3yr": "1-3 years",
    "3yr_plus": "more than 3 years",
  };
  return map[d] ?? d;
}

export function buildAdmissionsPrompt(intake: IntakeFormData): string {
  const isMinor = intake.ageBracket !== "adult_18plus";
  const isChild = intake.ageBracket === "under_13";
  const isTeen = intake.ageBracket === "teen_13_17";

  const childrenSection = intake.hasChildren
    ? `\n- Children Involved: YES — ${intake.childrenInfo || "details not provided"}`
    : "\n- Children Involved: No";

  const intakeSummary = `INTAKE FORM SUBMISSION
─────────────────────────────
- Filer Age Group: ${ageLabel(intake.ageBracket)}
- Other Party: ${intake.otherPartyDescription || "Not specified"}
- Relationship Type: ${intake.relationshipStatus}
- Known Each Other: ${durationLabel(intake.durationKnown)}${childrenSection}

BACKGROUND (how things got to this point):
${intake.background || "Not provided"}

THE SPECIFIC INCIDENT (what triggered this filing):
${intake.incident || "Not provided"}
When: ${intake.incidentWhen || "Not specified"}

DESIRED OUTCOME:
${intake.desiredOutcome || "Not specified"}
─────────────────────────────`;

  const ageGuidelines = isChild
    ? `IMPORTANT — CHILD FILER (UNDER 13):
This case involves a young child. Treat all matters seriously but with great care and age-appropriate framing.
- This is likely a friendship or school dispute, not an adult relationship conflict.
- Focus on: friendship values, trust, honesty, keeping promises, being kind, standing up for yourself respectfully.
- Use simple, clear language a young person can understand.
- Encourage positive values, good choices, and healthy friendships.
- Never dismiss the problem as trivial — young people's feelings and friendships matter deeply.
- The "court" here is about helping them understand right from wrong, not legal proceedings.
- Recommended court types for children: school_friend, school_group`
    : isTeen
    ? `IMPORTANT — TEEN FILER (13-17):
This case involves a teenager. This could be a friendship dispute, school conflict, or early romantic situation.
- Treat the matter seriously and with full respect — teen problems are real problems.
- Focus on: trust, loyalty, honesty, keeping one's word, communication, healthy boundaries, emotional maturity.
- Instill values: priorities, planning for the future, not letting conflicts derail important goals.
- Avoid adult legal framing — be direct, relatable, and genuinely helpful.
- If romantic: treat age-appropriately, no adult relationship drama framing.
- Recommended court types for teens: school_friend, school_relationship, school_group, friend`
    : `ADULT FILER (18+):
Standard admissions assessment. Determine if this dispute has enough substance and context for a courtroom session.
- Assess whether the matter is genuine, specific, and actionable.
- Consider the relationship context and what a realistic resolution could look like.
- Recommended court types: dating, engaged, married, divorced, friend, group`;

  return `You are the Court Admissions Officer for PeacemakerAI — a neutral AI dispute resolution service. You review case intake forms and determine if the matter is suitable for our courtroom.

${ageGuidelines}

CORE MISSION: De-escalate conflicts. Help people feel heard. Promote resolution, communication, and mutual understanding.

ADMISSIBILITY CRITERIA:
- ADMIT if: the dispute is genuine, has enough detail, and involves a real interpersonal conflict worth addressing.
- ADMIT even if the situation seems one-sided or messy — that is why people come to court.
- DO NOT ADMIT if: the submission is spam, contains clear safety threats, or is entirely incoherent.
- For all ages: if safety or abuse is present, do NOT admit — the safety system handles this separately.

${intakeSummary}

TASK: Review this intake form and return ONLY a valid JSON object — no other text, no markdown, no explanation outside the JSON.

Required format:
{
  "admitted": true or false,
  "ruling": "2-3 sentence formal court statement written directly to the filer. If admitted: acknowledge the situation and what the court will examine. If not admitted: explain respectfully why and suggest what they could do instead. For minors: use warm, encouraging, age-appropriate language.",
  "courtType": "one of: dating | engaged | married | divorced | school_relationship | school_friend | school_group | friend | group",
  "ageCategory": "child | teen | adult",
  "focus": "One sentence describing what the judge will specifically focus on in this case."
}`;
}
