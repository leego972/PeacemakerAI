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

const router: IRouter = Router();
const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SAFETY_RULES = `ABSOLUTE RULES — NEVER BREAK THESE:
1. You are NOT a lawyer, therapist, or crisis service. Never give legal, medical, or therapeutic advice.
2. Never use the words "should", "must", "need to", "have to", "recommend", or "advise".
3. Keep every response under 80 words.
4. You are a neutral observer — never an advocate for either side.
5. Speak plain, simple language. No legal jargon.
6. NEVER tell any party to get married, get divorced, or separate. Those are personal decisions that are not yours to make.
7. NEVER condone, suggest, or tolerate violence, harassment, intimidation, or any form of abuse toward anyone.
8. Rule ONLY on the specific incident before the court. Do not render judgment on the entire relationship history.
9. Your aim is resolution AND preservation of the relationship where possible. Seek understanding, not condemnation.
10. When children are involved, their wellbeing, stability, and healthy development are the FIRST priority — above either adult's grievances or desires. Frame every question and observation through what best serves the children.
11. In co-parenting matters, always guide toward a healthy, cooperative parenting environment. The children's consistent routine, emotional safety, and access to both parents (where safe) matter most.
12. If ANY message involves ACTIVE physical violence, weapons, child endangerment, sexual assault, or suicide crisis: stop immediately and respond ONLY with: SAFETY_STOP`;

// Extract a tagged section from the opening argument text
function extractSection(text: string, header: string): string {
  const idx = text.indexOf(header);
  if (idx === -1) return "";
  const end = text.indexOf("\n\n", idx);
  return text.slice(idx, end === -1 ? undefined : end);
}

// Determine if children are the actual SUBJECT of this dispute, not just background context
function childrenAreDisputeSubject(openingArgument: string, courtType: string): boolean {
  if (courtType === "coparenting") return true;
  // Only look at the incident and desired outcome — not the background/family context lines
  const incidentText = extractSection(openingArgument, "Incident:");
  const outcomeText = extractSection(openingArgument, "Desired Outcome:");
  const disputeText = `${incidentText} ${outcomeText}`.toLowerCase();
  const childDisputeTerms = [
    "custody", "visitation", "co-parent", "coparent",
    "parenting plan", "child support", "parenting time",
    "who gets the kids", "access to the kids", "living with",
    "the kids stay", "children stay", "care of the children",
  ];
  return childDisputeTerms.some((t) => disputeText.includes(t));
}

function buildSystemPrompt(
  caseId: string,
  courtType: string,
  isOneSided: boolean,
  openingArgument: string,
): string {
  const judge = getJudgePersona(caseId);

  // Detect age category from the tagged marker the admissions officer embeds
  const ageCatMatch = openingArgument.match(/\[Filer Age Category:\s*(\w+)\]/i);
  const ageCategory = ageCatMatch?.[1] ?? "adult";

  // Children are a ruling factor ONLY when the dispute itself is about them
  const childDispute = childrenAreDisputeSubject(openingArgument, courtType);

  let context: string;

  if (childDispute) {
    context = "This case is directly about children — custody, parenting arrangements, or child welfare. The children's wellbeing, stability, and healthy development are the FIRST priority above either adult's grievances or desires. Every question and observation must be guided by what serves the children best. Co-parenting cooperation and a consistent, loving environment for the children is always the goal.";
  } else if (ageCategory === "child") {
    context = "You are speaking with a young child (under 13). Use very simple, warm, and encouraging language — no legal framing whatsoever. Focus on: honesty, fairness, keeping promises, being a good friend, and treating others with kindness. Help them understand what went wrong in this specific situation and how to make it right. This is about learning values — not punishment. Questions should be short and easy to answer.";
  } else if (ageCategory === "teen") {
    context = "You are speaking with a teenager (13-17). Be direct and respectful — no condescension. Take their situation seriously. Focus on: trust, loyalty, accountability, communication, and the kind of person they want to be. Help them build the skills to handle this type of conflict themselves in future. Keep language relatable. Questions should get to the heart of what actually happened and why.";
  } else {
    const typeLabel: Record<string, string> = {
      dating: "people who are dating",
      engaged: "an engaged couple",
      married: "a married couple",
      separated: "a separated couple",
      divorced: "a divorced couple",
      friend: "friends",
      friends: "friends",
      coworkers: "coworkers",
      group: "a group",
    };
    context = `This is a dispute between ${typeLabel[courtType] ?? courtType}. Rule ONLY on the specific incident before the court — not on the entire relationship or background history. Seek resolution and preservation of the relationship where possible.`;
  }

  const oneSidedNote = isOneSided
    ? "\n\nIMPORTANT: The other party declined to appear. You are hearing one side only. Acknowledge this openly. Ask clarifying questions of the person present. Deliver a fair observation based on what you have heard, noting you only have one perspective. Do not fully condemn the absent party."
    : "";

  return `${SAFETY_RULES}\n\n${judge.systemPersona}\n\n${context}${oneSidedNote}`;
}

// SSE heartbeat map — keeps connections alive
const sseClients = new Map<string, Set<ReturnType<typeof res_sse_helper>>>();

function res_sse_helper(res: Parameters<typeof router.get>[1] extends (req: any, res: infer R) => any ? R : never) {
  return res;
}

// GET /judge/:caseId/session — SSE stream for real-time courtroom updates
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

  if (!sseClients.has(caseId)) sseClients.set(caseId, new Set());
  sseClients.get(caseId)!.add(res as any);

  res.write(`data: ${JSON.stringify({ type: "connected", caseId, status: c.status })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.get(caseId)?.delete(res as any);
  });
});

// Broadcast an event to all SSE clients watching a case
function broadcastToCase(caseId: string, event: object) {
  const clients = sseClients.get(caseId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((client: any) => {
    try { client.write(payload); } catch { /* client disconnected */ }
  });
}

// POST /judge/:caseId/respondent-intake — respondent submits their perspective before courtroom opens
router.post(
  "/judge/:caseId/respondent-intake",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = req.auth!.userId;
    const caseId = req.params.caseId as string;
    const { perspective, context, desiredOutcome } = req.body as {
      perspective?: string;
      context?: string;
      desiredOutcome?: string;
    };

    if (!perspective) {
      res.status(400).json({ error: "perspective is required" });
      return;
    }

    const [c] = await db.select().from(casesTable)
      .where(and(
        eq(casesTable.id, caseId),
        eq(casesTable.respondentId, userId),
      )).limit(1);

    if (!c) { res.status(404).json({ error: "Case not found or not a respondent" }); return; }

    const parts = [
      `[Respondent's Opening Statement]: ${perspective.trim()}`,
      context?.trim() ? `[Respondent's Background Context]: ${context.trim()}` : null,
      desiredOutcome?.trim() ? `[Respondent's Desired Resolution]: ${desiredOutcome.trim()}` : null,
    ].filter(Boolean).join("\n\n");

    const now = Date.now();
    await db.insert(messagesTable).values({ caseId, role: "user", content: parts, ts: now });

    broadcastToCase(caseId, { type: "message", role: "user", speakerLabel: "Respondent", content: parts, timestamp: now });

    res.json({ ok: true });
  },
);

// POST /judge/:caseId/message — send message to the judge
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

    // Pass recommend_help context to response if middleware flagged it
    const recommendCategory = res.locals.safetyRecommend as string | undefined;

    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const isSummoner = c.summonerId === userId;
    const speakerLabel = isSummoner ? "Claimant" : "Respondent";
    const taggedContent = `[${speakerLabel} — ${me?.name ?? "User"}]: ${content}`;

    const now = Date.now();
    await db.insert(messagesTable).values({ caseId, role: "user", content: taggedContent, ts: now });

    broadcastToCase(caseId, {
      type: "message",
      role: "user",
      speakerLabel,
      content: taggedContent,
      timestamp: now,
    });

    const history = await db.select().from(messagesTable)
      .where(eq(messagesTable.caseId, caseId))
      .orderBy(asc(messagesTable.ts));

    const opening = c.openingArgument ?? "";
    const openingPreamble = `[Claimant's Opening Statement]: ${opening}`;
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
      opening,
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
        res.json({ safetyStop: true, safetyLevel: "authority_only", category: "judge_flagged" });
        return;
      }

      const judgeTs = Date.now();
      const [judgeMsg] = await db.insert(messagesTable).values({
        caseId,
        role: "judge",
        content: judgeContent.trim(),
        ts: judgeTs,
      }).returning();

      const isVerdict = judgeContent.includes("Court is adjourned");
      if (isVerdict) {
        await db.update(casesTable)
          .set({ status: "awaiting_fair_call", verdict: judgeContent.trim(), updatedAt: new Date() })
          .where(eq(casesTable.id, caseId));

        const parties = [c.summonerId, c.respondentId].filter(Boolean) as string[];
        for (const uid of parties) {
          await db.insert(notificationsTable).values({
            userId: uid,
            type: "verdict",
            title: "Verdict Delivered",
            body: `${judge.name} has delivered a verdict. Tap to review and tap Fair Call if you agree.`,
            data: JSON.stringify({ caseId }),
            caseId,
          });
        }

        broadcastToCase(caseId, { type: "verdict", content: judgeContent.trim(), timestamp: judgeTs });

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

      broadcastToCase(caseId, {
        type: "message",
        role: "judge",
        content: judgeContent.trim(),
        timestamp: judgeTs,
        isVerdict,
      });

      res.json({
        safetyStop: false,
        safetyLevel: "none",
        isVerdict,
        recommendHelp: recommendCategory ?? null,
        message: { id: judgeMsg.id, role: "judge", content: judgeMsg.content, timestamp: judgeMsg.ts },
      });
    } catch (e) {
      logger.error({ e }, "Judge route unexpected error");
      res.status(500).json({ error: "Unexpected error" });
    }
  },
);

export default router;
