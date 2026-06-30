import { Router, type IRouter } from "express";
import { db, usersTable, relationshipsTable, notificationsTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";
import { getAgeTier } from "./auth";

const router: IRouter = Router();
router.use(requireAuth);

// Relationship type options by age tier
const TEEN_TYPES = ["friend", "school", "group", "dating", "engaged"];
const ADULT_TYPES = ["dating", "engaged", "married", "divorced", "coparenting"];

// Health score labels
export function healthLabel(score: number): string {
  if (score >= 85) return "Smooth Sailing";
  if (score >= 60) return "Steady Waters";
  if (score >= 40) return "Choppy Seas";
  if (score >= 20) return "Walking on Eggshells";
  return "Storm Warning";
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

// GET /relationships/me — list all my linked relationships
router.get("/relationships/me", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const rows = await db.select().from(relationshipsTable)
    .where(
      or(
        eq(relationshipsTable.initiatorId, userId),
        eq(relationshipsTable.partnerId, userId),
      )
    );

  const enriched = await Promise.all(rows.map(async (r) => {
    const isInitiator = r.initiatorId === userId;
    const otherId = isInitiator ? r.partnerId : r.initiatorId;
    let partnerName = r.partnerEmail;
    if (otherId) {
      const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId)).limit(1);
      if (other) partnerName = other.name;
    }
    return {
      ...r,
      partnerName,
      healthLabel: healthLabel(r.healthScore),
      isInitiator,
    };
  }));

  res.json(enriched);
});

// POST /relationships/invite — send partner invite link
router.post("/relationships/invite", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const { partnerEmail, relationshipType, isCoparenting } = req.body as {
    partnerEmail?: string;
    relationshipType?: string;
    isCoparenting?: boolean;
  };

  if (!partnerEmail || !relationshipType) {
    res.status(400).json({ error: "partnerEmail and relationshipType are required" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me) { res.status(404).json({ error: "User not found" }); return; }

  const tier = getAgeTier(me.dob ?? "2000-01-01");
  const allowed = tier === "teen" ? TEEN_TYPES : ADULT_TYPES;
  if (!allowed.includes(relationshipType)) {
    res.status(400).json({ error: `Relationship type '${relationshipType}' not allowed for your age group` });
    return;
  }

  // Adults (18+) can only have one non-coparenting partner
  if (tier === "adult") {
    const existing = await db.select().from(relationshipsTable)
      .where(
        and(
          or(
            eq(relationshipsTable.initiatorId, userId),
            eq(relationshipsTable.partnerId, userId),
          ),
          eq(relationshipsTable.status, "linked"),
        )
      );
    const activeNonCo = existing.filter(r => !r.isCoparenting);
    if (activeNonCo.length > 0 && !isCoparenting) {
      res.status(409).json({
        error: "You already have a linked partner. Release them first, or mark this as a co-parenting link.",
      });
      return;
    }
  }

  if (partnerEmail.toLowerCase() === me.email.toLowerCase()) {
    res.status(400).json({ error: "You cannot link yourself" });
    return;
  }

  const inviteToken = crypto.randomBytes(24).toString("hex");
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Check if partner is already on the app
  const [partner] = await db.select().from(usersTable)
    .where(eq(usersTable.email, partnerEmail.toLowerCase())).limit(1);

  const [relationship] = await db.insert(relationshipsTable).values({
    initiatorId: userId,
    partnerId: partner?.id ?? null,
    partnerEmail: partnerEmail.toLowerCase(),
    relationshipType,
    isCoparenting: isCoparenting ?? false,
    inviteToken,
    inviteExpiresAt,
    status: "pending",
    healthScore: 70,
  }).returning();

  // If partner is already on the app, send them an in-app notification
  if (partner) {
    await db.insert(notificationsTable).values({
      userId: partner.id,
      type: "relationship_invite",
      title: "Partner Invite",
      body: `${me.name} wants to link you as their ${relationshipType} partner on PeacemakerAI.`,
      data: JSON.stringify({ relationshipId: relationship.id, inviteToken }),
      relationshipId: relationship.id,
    });
  }

  const deepLink = `peacemakerai://invite/${inviteToken}`;
  res.status(201).json({
    relationship,
    inviteToken,
    deepLink,
    partnerIsRegistered: !!partner,
    message: partner
      ? `${partner.name} has been notified in the app.`
      : `Share this link with ${partnerEmail}: ${deepLink}`,
  });
});

// POST /relationships/accept/:token — partner accepts invite via deep link token
router.post("/relationships/accept/:token", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const { token } = req.params;

  const [rel] = await db.select().from(relationshipsTable)
    .where(eq(relationshipsTable.inviteToken, token as string)).limit(1);

  if (!rel) { res.status(404).json({ error: "Invite not found or already used" }); return; }
  if (rel.status !== "pending") {
    res.status(409).json({ error: "This invite has already been used or expired" });
    return;
  }
  if (new Date() > rel.inviteExpiresAt) {
    res.status(410).json({ error: "This invite has expired" });
    return;
  }
  if (rel.initiatorId === userId) {
    res.status(400).json({ error: "You cannot accept your own invite" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me) { res.status(404).json({ error: "User not found" }); return; }

  const [updated] = await db.update(relationshipsTable)
    .set({ partnerId: userId, status: "linked" })
    .where(eq(relationshipsTable.id, rel.id))
    .returning();

  // Notify initiator
  await db.insert(notificationsTable).values({
    userId: rel.initiatorId,
    type: "relationship_invite",
    title: "Partner Linked",
    body: `${me.name} accepted your partner invite. You are now linked on PeacemakerAI.`,
    data: JSON.stringify({ relationshipId: rel.id }),
    relationshipId: rel.id,
  });

  res.json({ relationship: updated, healthLabel: healthLabel(updated.healthScore) });
});

// POST /relationships/:id/release — unlink partner
router.post("/relationships/:id/release", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const { id } = req.params;

  const [rel] = await db.select().from(relationshipsTable)
    .where(eq(relationshipsTable.id, id as string)).limit(1);

  if (!rel) { res.status(404).json({ error: "Relationship not found" }); return; }
  if (rel.initiatorId !== userId && rel.partnerId !== userId) {
    res.status(403).json({ error: "Not your relationship" });
    return;
  }

  const [updated] = await db.update(relationshipsTable)
    .set({ status: "released" })
    .where(eq(relationshipsTable.id, rel.id))
    .returning();

  // Notify the other person
  const otherId = rel.initiatorId === userId ? rel.partnerId : rel.initiatorId;
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (otherId && me) {
    await db.insert(notificationsTable).values({
      userId: otherId,
      type: "relationship_invite",
      title: "Partner Unlinked",
      body: `${me.name} has released the partner link. Your profile is now unattached.`,
      data: JSON.stringify({ relationshipId: rel.id }),
      relationshipId: rel.id,
    });
  }

  res.json({ relationship: updated });
});

// PATCH /relationships/:id/status — update relationship type (e.g. dating -> engaged -> married -> divorced)
router.patch("/relationships/:id/status", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const { id } = req.params;
  const { relationshipType, isCoparenting } = req.body as {
    relationshipType?: string;
    isCoparenting?: boolean;
  };

  const [rel] = await db.select().from(relationshipsTable)
    .where(and(eq(relationshipsTable.id, id as string), eq(relationshipsTable.status, "linked"))).limit(1);
  if (!rel) { res.status(404).json({ error: "Relationship not found or not linked" }); return; }
  if (rel.initiatorId !== userId && rel.partnerId !== userId) {
    res.status(403).json({ error: "Not your relationship" }); return;
  }

  const updates: Partial<typeof relationshipsTable.$inferInsert> = {};
  if (relationshipType) updates.relationshipType = relationshipType;
  if (isCoparenting !== undefined) updates.isCoparenting = isCoparenting;

  const [updated] = await db.update(relationshipsTable)
    .set(updates)
    .where(eq(relationshipsTable.id, rel.id))
    .returning();

  res.json({ relationship: updated, healthLabel: healthLabel(updated.healthScore) });
});

export default router;
