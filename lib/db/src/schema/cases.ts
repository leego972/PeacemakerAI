import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relationshipsTable } from "./relationships";

// Case status lifecycle:
// pending_response -> in_session -> awaiting_fair_call -> resolved
//                  -> declined   -> one_sided_verdict
//                  -> expired    (no response in 48h)
//                  -> dismissed  (admin / safety stop)

export const casesTable = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  relationshipId: uuid("relationship_id").notNull().references(() => relationshipsTable.id, { onDelete: "cascade" }),
  summonerId: uuid("summoner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  respondentId: uuid("respondent_id").references(() => usersTable.id, { onDelete: "set null" }),
  courtType: text("court_type").notNull(),
  title: text("title").notNull(),
  openingArgument: text("opening_argument").notNull(),
  status: text("status").notNull().default("pending_response"),
  respondentDeclineReason: text("respondent_decline_reason"),
  verdict: text("verdict"),
  verdictType: text("verdict_type"),
  isOneSided: boolean("is_one_sided").notNull().default(false),
  fairCallSummoner: boolean("fair_call_summoner").notNull().default(false),
  fairCallRespondent: boolean("fair_call_respondent").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  healthScoreDelta: integer("health_score_delta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
