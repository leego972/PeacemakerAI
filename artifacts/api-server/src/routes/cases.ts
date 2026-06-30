import { Router, type IRouter } from "express";
import { db, casesTable, messagesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/cases", async (req, res): Promise<void> => {
  const cases = await db.select().from(casesTable)
    .where(eq(casesTable.userId, req.auth!.userId))
    .orderBy(casesTable.updatedAt);
  res.json(cases.reverse());
});

router.post("/cases", async (req, res): Promise<void> => {
  const { courtId, title } = req.body as { courtId?: string; title?: string };
  if (!courtId || !title) {
    res.status(400).json({ error: "courtId and title are required" });
    return;
  }
  const [newCase] = await db.insert(casesTable).values({
    userId: req.auth!.userId,
    courtId,
    title: title.trim(),
    status: "active",
  }).returning();
  res.status(201).json(newCase);
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [c] = await db.select().from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.auth!.userId)))
    .limit(1);
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.caseId, id))
    .orderBy(asc(messagesTable.ts));
  res.json({ ...c, messages: msgs.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.ts })) });
});

router.patch("/cases/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, verdict, verdictType } = req.body as { status?: string; verdict?: string; verdictType?: string };
  const [existing] = await db.select().from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.auth!.userId)))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Case not found" }); return; }
  const [updated] = await db.update(casesTable)
    .set({ ...(status && { status }), ...(verdict && { verdict }), ...(verdictType && { verdictType }), updatedAt: new Date() })
    .where(eq(casesTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/cases/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.auth!.userId)))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Case not found" }); return; }
  await db.delete(casesTable).where(eq(casesTable.id, id));
  res.sendStatus(204);
});

export default router;
