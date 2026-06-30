import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// In-app notification inbox — also used as the trigger for push notifications.
// Types:
//   relationship_invite  – someone linked you
//   summons              – you've been summoned to court
//   summons_accepted     – respondent accepted
//   summons_declined     – respondent declined
//   session_start        – both parties are now in session
//   verdict              – judge has delivered a verdict
//   fair_call            – partner tapped Fair Call
//   case_expired         – summons expired with no response

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: text("data"),
  read: boolean("read").notNull().default(false),
  caseId: uuid("case_id"),
  relationshipId: uuid("relationship_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
