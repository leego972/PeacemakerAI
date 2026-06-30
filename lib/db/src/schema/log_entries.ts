import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { casesTable } from "./cases";

// One entry per user per case — records the outcome from their perspective.
// role:    summoner | respondent
// outcome: fair_call | one_sided_verdict | declined | expired | dismissed

export const logEntriesTable = pgTable("log_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  courtType: text("court_type").notNull(),
  title: text("title").notNull(),
  outcome: text("outcome").notNull(),
  verdictSummary: text("verdict_summary"),
  healthScoreDelta: integer("health_score_delta").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLogEntrySchema = createInsertSchema(logEntriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type LogEntry = typeof logEntriesTable.$inferSelect;
