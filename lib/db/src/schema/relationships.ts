import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// Relationship types allowed per age tier:
// Teen (under 18):  friend | school | group | dating | engaged
// Adult (18+):      dating | engaged | married | divorced | coparenting
// coparenting is a special sub-type of divorced — two accounts can be
// simultaneously linked as coparenting AND one of them can have a second
// link as married/dating to a different person.

export const relationshipsTable = pgTable("relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiatorId: uuid("initiator_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => usersTable.id, { onDelete: "set null" }),
  partnerEmail: text("partner_email").notNull(),
  relationshipType: text("relationship_type").notNull(),
  // pending -> linked -> released
  status: text("status").notNull().default("pending"),
  isCoparenting: boolean("is_coparenting").notNull().default(false),
  inviteToken: text("invite_token").notNull().unique(),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }).notNull(),
  healthScore: integer("health_score").notNull().default(70),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRelationshipSchema = createInsertSchema(relationshipsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationshipsTable.$inferSelect;
