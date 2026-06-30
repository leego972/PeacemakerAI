import { Router, type IRouter } from "express";
import { db, casesTable, relationshipsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { admissionsLimiter } from "../middlewares/rateLimit";
import { checkCaseSuitability } from "../lib/caseSuitability";
import { findRepeatDispute } from "../lib/repeatDispute";

const router: IRouter = Router();
router.use(requireAuth);

const DUPLICATE_CASE_LOOKBACK_LIMIT = 50;

type AdmissionsInput = {
  relationshipId?: string;
  courtType?: string;
  title?: string;
  openingArgument?: string;
  respondentStatement?: string;
  content?: string;
  participantAge?: number;
  relationshipType?: string;
  personalConnectionConfirmed?: boolean;
};

function getCourtRoute(category?: string) {
  switch (category) {
    case "safety":
      return "safety_resources";
    case "child_welfare":
      return "child_safety_school_support";
    case "public_figure":
      return "public_targeting_blocked";
    case "legal":
    case "money":
    case "parenting":
    case "property":
    case "professional":
      return "outside_scope";
    default:
      return "courtroom";
  }
}

router.post("/admissions/screen", admissionsLimiter, async (req, res): Promise<void> => {
  const input = req.body as AdmissionsInput;
  const userId = req.auth!.userId;
  const personalConnectionRequired = input.personalConnectionConfirmed !== true;

  if (personalConnectionRequired) {
    res.status(422).json({
      accepted: false,
      route: "consent_required",
      category: "consent",
      reason: "PeacemakerAI only accepts voluntary private disputes between people who personally know each other.",
      redirect: "Ask the filer to confirm this is a private everyday dispute and that the invited person can freely accept, decline, block, or report.",
    });
    return;
  }

  const suitability = checkCaseSuitability(input);

  if (!suitability.suitable) {
    res.status(200).json({
      accepted: false,
      route: getCourtRoute(suitability.category),
      category: suitability.category,
      reason: suitability.reason,
      redirect: suitability.redirect,
    });
    return;
  }

  if (input.relationshipId && input.courtType && input.title && input.openingArgument) {
    const [rel] = await db.select().from(relationshipsTable)
      .where(and(
        eq(relationshipsTable.id, input.relationshipId),
        eq(relationshipsTable.status, "linked"),
      )).limit(1);

    if (!rel || (rel.initiatorId !== userId && rel.partnerId !== userId)) {
      res.status(403).json({
        accepted: false,
        route: "consent_required",
        category: "consent",
        reason: "This relationship/contact is not linked to your account.",
        redirect: "Create or select a valid private contact before screening the case.",
      });
      return;
    }

    const existingCases = await db.select().from(casesTable)
      .where(eq(casesTable.relationshipId, input.relationshipId))
      .orderBy(desc(casesTable.updatedAt))
      .limit(DUPLICATE_CASE_LOOKBACK_LIMIT);

    const repeatDispute = findRepeatDispute({
      courtType: input.courtType,
      title: input.title,
      openingArgument: input.openingArgument,
      existingCases,
    });

    if (repeatDispute.repeated) {
      res.status(200).json({
        accepted: false,
        route: "repeat_dispute",
        category: "repeat_dispute",
        reason: repeatDispute.reason,
        existingCaseId: repeatDispute.existingCaseId,
        existingStatus: repeatDispute.existingStatus,
        similarity: repeatDispute.similarity,
        redirect: "Open the existing case, use Fair Call, or create a new case only if there is a materially new incident with new facts.",
      });
      return;
    }
  }

  res.status(200).json({
    accepted: true,
    route: "courtroom",
    category: "eligible",
    reason: "This appears suitable for a private non-binding fairness hearing.",
    redirect: "Proceed to judge assignment, payment gate if needed, and private summons.",
  });
});

export default router;
