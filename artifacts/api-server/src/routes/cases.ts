import { Router, type IRouter } from "express";
import {
  db, casesTable, messagesTable, relationshipsTable,
  notificationsTable, logEntriesTable, usersTable,
} from "@workspace/db";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { caseFilingLimiter } from "../middlewares/rateLimit";
import { checkCaseSuitability } from "../lib/caseSuitability";
import { findRepeatDispute } from "../lib/repeatDispute";

const router: IRouter = Router();
router.use(requireAuth);

const SUMMONS_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const DUPLICATE_CASE_LOOKBACK_LIMIT = 50;

// Adjust health score and write log entries after a case concludes
async function finalizeCase(
  caseId: string,
  relationshipId: string,
  summonerId: string,
  respondentId: string | null,
  outcome: "fair_call" | "one_sided_verdict" | "declined" | "expired",
  verdictSummary: string | null,
  courtType: string,
  title: string,
) {
  let delta = 0;
  if (outcome === "fair_call") delta = 15;
  else if (outcome === "one_sided_verdict") delta = -10;
  else if (outcome === "declined") delta = -5;
  else if (outcome === "expired") delta = -5;

  // Update relationship health score
  const [rel] = await db.select().from(relationshipsTable)
    .where(eq(relationshipsTable.id, relationshipId)).limit(1);
  if (rel) {
    const newScore = Math.max(0, Math.min(100, rel.healthScore + delta));
    await db.update(relationshipsTable)
      .set({ healthScore: newScore })
      .where(eq(relationshipsTable.id, relationshipId));
  }

  // Write log entry for summoner
  await db.insert(logEntriesTable).values({
    userId: summonerId,
    caseId,
    role: "summoner",
    courtType,
    title,
    outcome,
    verdictSummary,
    healthScoreDelta: delta,
  });

  // Write log entry for respondent if they participated
  if (respondentId && outcome !== "expired") {
    await db.insert(logEntriesTable).values({
      userId: respondentId,
      caseId,
      role: "respondent",
      courtType,
      title,
      outcome,
      verdictSummary,
      healthScoreDelta: delta,
    });
  }
}

// GET /cases — list my cases (as summoner or respondent)
router.get("/cases", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const rows = await db.select().from(casesTable)
    .where(
      or(
        eq(casesTable.summonerId, userId),
        eq(casesTable.respondentId, userId),
      )
    )
    .orderBy(desc(casesTable.updatedAt));
  res.json(rows);
});

// POST /cases — file a new case (summon partner/contact)
router.post("/cases", caseFilingLimiter, async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const { relationshipId, courtType, title, openingArgument, personalConnectionConfirmed } = req.body as {
    relationshipId?: string;
    courtType?: string;
    title?: string;
    openingArgument?: string;
    personalConnectionConfirmed?: boolean;
  };

  if (!relationshipId || !courtType || !title || !openingArgument) {
    res.status(400).json({ error: "relationshipId, courtType, title and openingArgument are required" });
    return;
  }

  if (personalConnectionConfirmed !== true) {
    res.status(422).json({
      error: "Personal connection confirmation required",
      category: "consent",
      reason: "PeacemakerAI only accepts voluntary private disputes between people who personally know each other.",
      redirect: "Ask the filer to confirm this is a private everyday dispute and that the invited person can freely accept, decline, block, or report.",
    });
    return;
  }

  const suitability = checkCaseSuitability({ courtType, title, openingArgument });
  if (!suitability.suitable) {
    res.status(422).json({
      error: "Case not suitable for PeacemakerAI",
      category: suitability.category,
      reason: suitability.reason,
      redirect: suitability.redirect,
    });
    return;
  }

  // Verify relationship/contact exists and user is part of it
  const [rel] = await db.select().from(relationshipsTable)
    .where(and(
      eq(relationshipsTable.id, relationshipId),
      eq(relationshipsTable.status, "linked"),
    )).limit(1);

  if (!rel) {
    res.status(404).json({ error: "Relationship not found or not linked" });
    return;
  }
  if (rel.initiatorId !== userId && rel.partnerId !== userId) {
    res.status(403).json({ error: "You are not part of this relationship" });
    return;
  }

  const respondentId = rel.initiatorId === userId ? rel.partnerId : rel.initiatorId;
  if (!respondentId) {
    res.status(400).json({ error: "The other person has not linked their account yet" });
    return;
  }

  const existingCases = await db.select().from(casesTable)
    .where(eq(casesTable.relationshipId, relationshipId))
    .orderBy(desc(casesTable.updatedAt))
    .limit(DUPLICATE_CASE_LOOKBACK_LIMIT);

  const repeatDispute = findRepeatDispute({
    courtType,
    title,
    openingArgument,
    existingCases,
  });

  if (repeatDispute.repeated) {
    res.status(409).json({
      error: "Repeat dispute blocked",
      category: "repeat_dispute",
      reason: repeatDispute.reason,
      existingCaseId: repeatDispute.existingCaseId,
      existingStatus: repeatDispute.existingStatus,
      similarity: repeatDispute.similarity,
      redirect: "Open the existing case, use Fair Call, or create a new case only if there is a materially new incident with new facts.",
    });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const [newCase] = await db.insert(casesTable).values({
    relationshipId,
    summonerId: userId,
    respondentId,
    courtType,
    title: title.trim(),
    openingArgument: openingArgument.trim(),
    status: "pending_response",
    expiresAt: new Date(Date.now() + SUMMONS_TTL_MS),
    isOneSided: false,
    fairCallSummoner: false,
    fairCallRespondent: false,
  }).returning();

  // Notify respondent in-app
  await db.insert(notificationsTable).values({
    userId: respondentId,
    type: "summons",
    title: "You have been summoned",
    body: `${me?.name ?? "Someone you know"} has filed a case: "${title}". You have 48 hours to respond.`,
    data: JSON.stringify({ caseId: newCase.id }),
    caseId: newCase.id,
    relationshipId,
  });

  res.status(201).json(newCase);
});

// GET /cases/:id — get case with messages
router.get("/cases/:id", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;

  const [c] = await db.select().from(casesTable)
    .where(and(
      eq(casesTable.id, id),
      or(eq(casesTable.summonerId, userId), eq(casesTable.respondentId, userId)),
    )).limit(1);

  if (!c) { res.status(404).json({ error: "Case not found" }); return; }

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.caseId, id))
    .orderBy(asc(messagesTable.ts));

  res.json({
    ...c,
    messages: msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.ts,
    })),
  });
});

// POST /cases/:id/respond — respondent accepts or declines summons
router.post("/cases/:id/respond", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;
  const { accept, declineReason } = req.body as { accept: boolean; declineReason?: string };

  const [c] = await db.select().from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.respondentId, userId))).limit(1);

  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  if (c.status !== "pending_response") {
    res.status(409).json({ error: "Case is no longer pending a response" });
    return;
  }
  if (new Date() > c.expiresAt!) {
    await db.update(casesTable).set({ status: "expired" }).where(eq(casesTable.id, id));
    res.status(410).json({ error: "Summons has expired" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (accept) {
    const [updated] = await db.update(casesTable)
      .set({ status: "in_session" })
      .where(eq(casesTable.id, id))
      .returning();

    await db.insert(notificationsTable).values({
      userId: c.summonerId,
      type: "summons_accepted",
      title: "Summons Accepted",
      body: `${me?.name ?? "The other person"} has accepted your summons. Court is now in session.`,
      data: JSON.stringify({ caseId: id }),
      caseId: id,
    });

    res.json(updated);
  } else {
    const [updated] = await db.update(casesTable)
      .set({
        status: "declined",
        respondentDeclineReason: declineReason?.trim() ?? null,
        isOneSided: true,
      })
      .where(eq(casesTable.id, id))
      .returning();

    await db.insert(notificationsTable).values({
      userId: c.summonerId,
      type: "summons_declined",
      title: "Summons Declined",
      body: `${me?.name ?? "The other person"} declined the summons${declineReason ? `: "${declineReason}"` : "."} The judge will hear your side only.`,
      data: JSON.stringify({ caseId: id }),
      caseId: id,
    });

    await finalizeCase(
      id, c.relationshipId, c.summonerId, userId,
      "declined", null, c.courtType ?? "", c.title,
    );

    res.json(updated);
  }
});

// POST /cases/:id/fair-call — both users tap Fair Call to resolve
router.post("/cases/:id/fair-call", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;

  const [c] = await db.select().from(casesTable)
    .where(and(
      eq(casesTable.id, id),
      or(eq(casesTable.summonerId, userId), eq(casesTable.respondentId, userId)),
    )).limit(1);

  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  if (!["in_session", "awaiting_fair_call"].includes(c.status)) {
    res.status(409).json({ error: "Fair Call is not available at this stage" });
    return;
  }

  const isSummoner = c.summonerId === userId;
  const updates: Partial<typeof casesTable.$inferInsert> = isSummoner
    ? { fairCallSummoner: true }
    : { fairCallRespondent: true };

  const bothAgreed = isSummoner
    ? c.fairCallRespondent
    : c.fairCallSummoner;

  if (bothAgreed) {
    updates.status = "resolved";
  } else {
    updates.status = "awaiting_fair_call";
  }

  const [updated] = await db.update(casesTable)
    .set(updates)
    .where(eq(casesTable.id, id))
    .returning();

  if (updated.status === "resolved") {
    await finalizeCase(
      id, c.relationshipId, c.summonerId, c.respondentId,
      "fair_call", c.verdict, c.courtType ?? "", c.title,
    );

    // Notify both
    const otherUserId = isSummoner ? c.respondentId : c.summonerId;
    if (otherUserId) {
      await db.insert(notificationsTable).values({
        userId: otherUserId,
        type: "fair_call",
        title: "Fair Call — Case Resolved",
        body: "Both parties agreed. This dispute has been resolved.",
        data: JSON.stringify({ caseId: id }),
        caseId: id,
      });
    }
  } else {
    // Notify the other person that one side tapped Fair Call
    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const otherUserId = isSummoner ? c.respondentId : c.summonerId;
    if (otherUserId) {
      await db.insert(notificationsTable).values({
        userId: otherUserId,
        type: "fair_call",
        title: "Fair Call Requested",
        body: `${me?.name ?? "The other person"} has tapped Fair Call. Tap yours to resolve the case.`,
        data: JSON.stringify({ caseId: id }),
        caseId: id,
      });
    }
  }

  res.json(updated);
});

// GET /cases/log — hearing logbook for the current user
router.get("/log", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const entries = await db.select().from(logEntriesTable)
    .where(eq(logEntriesTable.userId, userId))
    .orderBy(desc(logEntriesTable.createdAt));
  res.json(entries);
});

export { finalizeCase };
export default router;
