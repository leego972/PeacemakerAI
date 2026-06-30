import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimit";

const router: IRouter = Router();

function getAgeTier(dob: string): "teen" | "adult" {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age < 18 ? "teen" : "adult";
}

router.post("/auth/signup", authLimiter, async (req, res): Promise<void> => {
  const { name, email, password, dob, relationshipStatus } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    dob?: string;
    relationshipStatus?: string;
  };

  if (!name || !email || !password || !dob) {
    res.status(400).json({ error: "name, email, password and date of birth are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) {
    res.status(400).json({ error: "Invalid date of birth" });
    return;
  }

  const tier = getAgeTier(dob);
  const validAdultStatuses = ["single", "dating", "engaged", "married", "divorced"];
  const validTeenStatuses = ["single", "dating", "engaged"];
  const validStatuses = tier === "teen" ? validTeenStatuses : validAdultStatuses;
  const status = relationshipStatus && validStatuses.includes(relationshipStatus)
    ? relationshipStatus
    : "single";

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    dob,
    relationshipStatus: status,
  }).returning();

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      dob: user.dob,
      relationshipStatus: user.relationshipStatus,
      ageTier: tier,
    },
  });
});

router.post("/auth/signin", authLimiter, async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "No account found with that email" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email });
  const tier = getAgeTier(user.dob ?? "2000-01-01");
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      dob: user.dob,
      relationshipStatus: user.relationshipStatus,
      ageTier: tier,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.auth!.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const tier = getAgeTier(user.dob ?? "2000-01-01");
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    dob: user.dob,
    relationshipStatus: user.relationshipStatus,
    ageTier: tier,
  });
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { name, relationshipStatus, pushToken } = req.body as {
    name?: string;
    relationshipStatus?: string;
    pushToken?: string;
  };
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name) updates.name = name.trim();
  if (pushToken !== undefined) updates.pushToken = pushToken;
  if (relationshipStatus) {
    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, req.auth!.userId)).limit(1);
    if (user) {
      const tier = getAgeTier(user.dob ?? "2000-01-01");
      const validStatuses = tier === "teen"
        ? ["single", "dating", "engaged"]
        : ["single", "dating", "engaged", "married", "divorced"];
      if (validStatuses.includes(relationshipStatus)) {
        updates.relationshipStatus = relationshipStatus;
      }
    }
  }
  const [updated] = await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.auth!.userId))
    .returning();
  const tier = getAgeTier(updated.dob ?? "2000-01-01");
  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    dob: updated.dob,
    relationshipStatus: updated.relationshipStatus,
    ageTier: tier,
  });
});

router.delete("/auth/me", requireAuth, async (req, res): Promise<void> => {
  await db.delete(usersTable).where(eq(usersTable.id, req.auth!.userId));
  res.sendStatus(204);
});

export { getAgeTier };
export default router;
