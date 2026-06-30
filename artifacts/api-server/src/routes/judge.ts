import { Router, type IRouter } from "express";
import {
  db, casesTable, messagesTable, notificationsTable, usersTable,
} from "@workspace/db";
import { eq, and, or, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { safetyMiddleware } from "../middlewares/safety";
import { judgeLimiter } from "../middlewares/rateLimit";
import { logger } from "../lib/logger";
import { finalizeCase } from "./cases";
import { getJudgePersona } from "../lib/judges";
import { checkCaseSuitability } from "../lib/caseSuitability";

const router: IRouter = Router();
const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SAFETY_RULES = `ABSOLUTE RULES — NEVER BREAK THESE:
1. You are NOT a lawyer, therapist, doctor, financial adviser, crisis service, police officer, court, or mediator.
2. Never give legal, medical, therapeutic, tax, investment, financial, custody, parenting-order, police, or court advice.
3. Never decide money owed, property ownership, custody, visitation, parenting schedules, child support, court orders, criminal allegations, defamation, or contracts.
4. Never issue a verdict against a celebrity, influencer, politician, public figure, public handle, journalist, creator, streamer, or person targeted for public commentary.
5. Never use the words "should", "must", "need to", "have to", "recommend", or "advise".
6. Keep every response under 80 words.
7. If ANY message involves physical violence, abuse, weapons, child endangerment, coercive control, stalking, active crime, or self-harm: stop immediately and respond ONLY with: SAFETY_STOP
8. You are a neutral observer — never an advocate for either side.
9. Speak plain, simple language. No legal jargon.
10. Verdicts are non-binding fairness observations based only on what was said in this private hearing.
11. The parties must never chat directly with each other. All communication is to and from you, the judge.
12. Do not quote one party's private submission directly to the other party unless it is essential and safe. Paraphrase neutrally when context is needed.
13. Ask each party targeted questions through the judge only. Do not tell parties to argue with each other.`;

function buildSystemPrompt(caseId: string, courtType: string, isOneSided: boolean, isCoparenting: boolean): string {
  const judge = getJudgePersona(caseId);

  const context = isCoparenting
    ? "This is a co-parenting communication dispute only. Do not discuss custody, parenting orders, visitation, child support, fitness, or legal arrangements. If the user asks for those, say this matter cannot be handled here."
    : courtType === "friend" || courtType === "school" || courtType === "group"
      ? "This dispute involves young people, friends, classmates, or a group. Be firm but age-appropriate."
      : `This is a ${courtType} everyday interpersonal dispute.`;

  const oneSidedNote = isOneSided
    ? "\n\nIMPORTANT: The other party declined to appear. You are hearing one side only. Acknowledge this openly. Ask clarifying questions of the person present. Deliver only a limited fairness observation based on one perspective. Do not condemn the absent party."
    : "";

  return `${SAFETY_RULES}\n\n${judge.systemPersona}\n\n${context}${oneSidedNote}`;
}

// SSE heartbeat map — keeps connections alive
const sseClients = new Map<string, Set<ReturnType<typeof res_sse_helper>>>();

function res_sse_helper(res: Parameters<typeof router.get>[1] extends (req: any, res: infer R) => any ? R : never) {
  return res;
}

// GET /judge/:caseId/session — SSE stream for real-time judge/courtroom updates
router.get("/judge/:caseId/session", requireAuth, async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const caseId = req.params.caseId as string;

  const [c] = await db.select().from(casesTable)
    .where(and(
      eq(casesTable.id, caseId),
      or(eq(casesTable.summonerId, userId), eq(casesTable.respondentId, userId)),
    )).limit(1);

  if (!c) { res.status(404).json({ error: "Case not found" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Register client. Only judge/system events are broadcast to all parties.
  if (!sseClients.has(caseId)) sseClients.set(caseId, new Set());
  sseClients.get(caseId)!.add(res as any);

  // Send current case state immediately
  res.write(`data: ${JSON.stringify({ type: "connected", caseId, status: c.status, mode: "judge_mediated" })}\n\n`);

  // Heartbeat every 25s
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.get(caseId)?.delete(res as any);
  });
});

// Broadcast judge/system events to all SSE clients watching a case.
// Do not use this for raw plaintiff/defendant submissions.
function broadcastToCase(caseId: string, event: object) {
  const clients = sseClients.get(caseId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((client: any) => {
    try { client.write(payload); } catch { /* client disconnected */ }
  });
}

// POST /judge/:caseId/message — submit private testimony/message to the judge
router.post(
  "/judge/:caseId/message",
  judgeLimiter,
  requireAuth,
  safetyMiddleware,
  async (req, res): Promise<void> => {
    const userId = req.auth!.userId;
    const caseId = req.params.caseId as string;
    const { content } = req.body as { content?: string };

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const messageSuitability = checkCaseSuitability({ content });
    if (!messageSuitability.suitable) {
      res.status(422).json({
        error: "Message not suitable for PeacemakerAI",
        category: messageSuitability.category,
        reason: messageSuitability.reason,
        redirect: messageSuitability.redirect,
      });
      return;
    }

    const [c] = await db.select().from(casesTable)
      .where(and(
        eq(casesTable.id, caseId),
        or(eq(casesTable.summonerId, userId), eq(casesTable.respondentId, userId)),
      )).limit(1);

    if (!c) { res.status(404).json({ error: "Case not found" }); return; }
    if (!["in_session", "declined"].includes(c.status)) {
      res.status(409).json({ error: "Court is not currently in session" });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "AI Judge is currently unavailable" });
      return;
    }

    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const isSummoner = c.summonerId === userId;
    const speakerLabel = isSummoner ? "Claimant" : "Respondent";
    const taggedContent = `[PRIVATE SUBMISSION TO JUDGE — ${speakerLabel} — ${me?.name ?? "User"}]: ${content}`;

    const now = Date.now();
    await db.insert(messagesTable).values({ caseId, role: "user", content: taggedContent, ts: now });

    // Do NOT broadcast raw user submissions to the other party.
    // The sender receives acknowledgement in the HTTP response; only judge replies are broadcast.

    const history = await db.select().from(messagesTable)
      .where(eq(messagesTable.caseId, caseId))
      .orderBy(asc(messagesTable.ts));

    // Build conversation for Groq — inject opening argument as private claimant submission.
    const openingPreamble = `[PRIVATE OPENING SUBMISSION TO JUDGE — Claimant]: ${c.openingArgument}`;
    const groqMessages = [
      { role: "user" as const, content: openingPreamble },
      ...history.map((m) => ({
        role: m.role === "judge" ? "assistant" as const : "user" as const,
        content: m.content,
      })),
    ];

    const judge = getJudgePersona(caseId);
    const systemPrompt = buildSystemPrompt(
      caseId,
      c.courtType ?? "dating",
      c.isOneSided,
      c.courtType === "coparenting",
    );

    try {
      const groqRes = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
          max_tokens: 200,
          temperature: 0.5,
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

      const judgeTs = Date.now();
      const [judgeMsg] = await db.insert(messagesTable).values({
        caseId,
        role: "judge",
        content: judgeContent.trim(),
        ts: judgeTs,
      }).returning();

      // Detect verdict delivery
      const isVerdict = judgeContent.includes("Court is adjourned");
      if (isVerdict) {
        await db.update(casesTable)
          .set({ status: "awaiting_fair_call", verdict: judgeContent.trim(), updatedAt: new Date() })
          .where(eq(casesTable.id, caseId));

        // Notify both parties
        const parties = [c.summonerId, c.respondentId].filter(Boolean) as string[];
        for (const uid of parties) {
          await db.insert(notificationsTable).values({
            userId: uid,
            type: "verdict",
            title: "Fairness Verdict Delivered",
            body: `${judge.name} has delivered a non-binding fairness verdict. Tap to review and tap Fair Call if you agree.`,
            data: JSON.stringify({ caseId }),
            caseId,
          });
        }

        broadcastToCase(caseId, { type: "verdict", content: judgeContent.trim(), timestamp: judgeTs });

        // Auto-finalize if one-sided (no respondent to tap Fair Call)
        if (c.isOneSided) {
          await finalizeCase(
            caseId, c.relationshipId, c.summonerId, null,
            "one_sided_verdict", judgeContent.trim(), c.courtType ?? "", c.title,
          );
          await db.update(casesTable).set({ status: "resolved" }).where(eq(casesTable.id, caseId));
        }
      } else {
        await db.update(casesTable).set({ updatedAt: new Date() }).where(eq(casesTable.id, caseId));
      }

      // Broadcast judge reply to all parties. Only judge output is shared.
      broadcastToCase(caseId, {
        type: "message",
        role: "judge",
        content: judgeContent.trim(),
        timestamp: judgeTs,
        isVerdict,
      });

      res.json({
        safetyStop: false,
        isVerdict,
        submission: {
          role: "user_private_submission",
          content,
          timestamp: now,
          visibleOnlyToSender: true,
        },
        message: { id: judgeMsg.id, role: "judge", content: judgeMsg.content, timestamp: judgeMsg.ts },
      });
    } catch (e) {
      logger.error({ e }, "Judge route unexpected error");
      res.status(500).json({ error: "Unexpected error" });
    }
  },
);

export default router;
