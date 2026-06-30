import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { checkCaseSuitability } from "../lib/caseSuitability";

const router: IRouter = Router();
router.use(requireAuth);

type AdmissionsInput = {
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

router.post("/admissions/screen", async (req, res): Promise<void> => {
  const input = req.body as AdmissionsInput;
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

  res.status(200).json({
    accepted: true,
    route: "courtroom",
    category: "eligible",
    reason: "This appears suitable for a private non-binding fairness hearing.",
    redirect: "Proceed to judge assignment, payment gate if needed, and private summons.",
  });
});

export default router;
