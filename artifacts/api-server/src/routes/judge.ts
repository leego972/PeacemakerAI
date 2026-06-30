import { Router, type IRouter } from "express";
import { db, casesTable, messagesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { safetyMiddleware } from "../middlewares/safety";
import { judgeLimiter } from "../middlewares/rateLimit";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const LEGAL_DISCLAIMER = `CRITICAL RULES YOU MUST FOLLOW WITHOUT EXCEPTION:
1. You are NOT a lawyer, therapist, counselor, or crisis service.
2. Give ONLY brief, neutral, factual observations. Never give legal, medical, or therapeutic advice.
3. Do NOT tell people what to do. Ask clarifying questions and reflect what you hear.
4. Keep every response under 80 words.
5. Never use the words "should", "must", "need to", "have to", "recommend", or "advise".
6. If ANY message involves physical violence, abuse, child endangerment, threats, weapons, or self-harm: IMMEDIATELY stop and respond with ONLY: "SAFETY_STOP"
7. You are a neutral observer — not an advocate for either side.
8. Speak in plain, simple language. No legal jargon.`;

const COURT_PROMPTS: Record<string, string> = {
  dating: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's Dating Court. This dispute involves two people in an early romantic relationship. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
  engaged: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's Engaged Court. This dispute involves two people who are engaged to be married. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
  married: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's Married Court. This dispute involves a married couple. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
  divorced: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's Divorced Court. This dispute involves two people navigating separation or post-divorce matters. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
  school_relationship: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's School Relationship Court. This dispute involves students in a romantic relationship at school. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
  school_friend: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's Friend Court. This dispute involves students who are friends or former friends. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
  school_group: `${LEGAL_DISCLAIMER}\n\nYou are the AI Judge of PeacemakerAI's Group Court. This dispute involves a group of three or more people. Ask SHORT neutral questions one at a time. After 4-6 exchanges deliver a brief balanced observation. End with: "Both perspectives have been noted. Court is adjourned."`,
};

router.post("/judge/:caseId/message", judgeLimiter, requireAuth, safetyMiddleware, async (req, res): Promise<void> => {
  const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
  const { content } = req.body as { content?: string };

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [c] = await db.select().from(casesTable)
    .where(and(eq(casesTable.id, caseId), eq(casesTable.userId, req.auth!.userId)))
    .limit(1);
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI Judge is currently unavailable" });
    return;
  }

  // Save user message
  const now = Date.now();
  await db.insert(messagesTable).values({ caseId, role: "user", content, ts: now });

  // Fetch full history for context
  const history = await db.select().from(messagesTable)
    .where(eq(messagesTable.caseId, caseId))
    .orderBy(asc(messagesTable.ts));

  const groqMessages = history.map((m) => ({
    role: m.role === "judge" ? "assistant" : "user",
    content: m.content,
  }));

  const systemPrompt = COURT_PROMPTS[c.courtId] ?? COURT_PROMPTS["dating"];

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
        max_tokens: 200,
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      req.log.error({ status: groqRes.status, err }, "Groq API error");
      res.status(502).json({ error: "AI Judge failed to respond" });
      return;
    }

    const data = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
    const judgeContent: string = data.choices?.[0]?.message?.content ?? "";

    if (judgeContent.includes("SAFETY_STOP")) {
      res.json({ safetyStop: true });
      return;
    }

    // Save judge reply
    const judgeTs = Date.now();
    const [judgeMsg] = await db.insert(messagesTable).values({
      caseId,
      role: "judge",
      content: judgeContent.trim(),
      ts: judgeTs,
    }).returning();

    // Touch case updatedAt
    await db.update(casesTable).set({ updatedAt: new Date() }).where(eq(casesTable.id, caseId));

    res.json({
      safetyStop: false,
      message: { id: judgeMsg.id, role: "judge", content: judgeMsg.content, timestamp: judgeMsg.ts },
    });
  } catch (e) {
    logger.error({ e }, "Judge route unexpected error");
    res.status(500).json({ error: "Unexpected error" });
  }
});

export default router;
