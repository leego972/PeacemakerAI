import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /notifications — get my in-app inbox
router.get("/notifications", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

// GET /notifications/unread-count
router.get("/notifications/unread-count", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const rows = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
  res.json({ count: rows.length });
});

// PATCH /notifications/:id/read — mark one as read
router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const { id } = req.params;
  await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id as string), eq(notificationsTable.userId, userId)));
  res.sendStatus(204);
});

// PATCH /notifications/read-all — mark all as read
router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId));
  res.sendStatus(204);
});

export default router;
