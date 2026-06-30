import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { buildAdmissionsPrompt, type IntakeFormData, type AdmissionsResult } from "../lib/admissionsPrompt";

const router: IRouter = Router();
const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

router.post("/admissions/screen", requireAuth, async (req, res): Promise<void> => {
  const intake = req.body as IntakeFormData;

  if (!intake || !intake.ageBracket || !intake.incident) {
    res.status(400).json({ error: "Incomplete intake form. Please fill in all required fields." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI Judge is currently unavailable" });
    return;
  }

  const systemPrompt = buildAdmissionsPrompt(intake);

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please review this intake form and return the JSON admissions ruling." },
        ],
        max_tokens: 400,
        temperature: 0.15,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      req.log.error({ status: groqRes.status, err }, "Groq admissions error");
      res.status(502).json({ error: "AI screening failed. Please try again." });
      return;
    }

    const data = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let result: AdmissionsResult;
    try {
      result = JSON.parse(raw) as AdmissionsResult;
    } catch {
      req.log.error({ raw }, "Failed to parse admissions JSON");
      result = {
        admitted: true,
        ruling: "Your case has been received. The court will hear your matter and ask clarifying questions before delivering a ruling.",
        courtType: intake.ageBracket !== "adult_18plus" ? "school_friend" : "friend",
        ageCategory: intake.ageBracket === "under_13" ? "child" : intake.ageBracket === "teen_13_17" ? "teen" : "adult",
        focus: "Understanding each party's perspective and identifying a path toward resolution.",
      };
    }

    if (!result.admitted && !result.ruling) {
      result.admitted = true;
      result.ruling = "Your case has been reviewed and admitted to court.";
    }

    res.json(result);
  } catch (e) {
    logger.error({ e }, "Admissions route unexpected error");
    res.status(500).json({ error: "Unexpected error during screening" });
  }
});

export default router;
