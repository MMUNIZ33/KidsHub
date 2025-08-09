import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(), // hashed password
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("leader"), // admin, leader, assistant
  isActive: boolean("is_active").default(true),
  classIds: text("class_ids").array().default([]), // linked classes for leaders/assistants
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Children table
export const children = pgTable("children", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  birthDate: date("birth_date"),
  classId: uuid("class_id").references(() => classes.id),
  photoUrl: varchar("photo_url"),
  allergies: text("allergies"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guardians table
export const guardians = pgTable("guardians", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(), // pai, mãe, avô, etc.
  phoneWhatsApp: varchar("phone_whatsapp", { length: 20 }).notNull(),
  email: varchar("email"),
  contactAuthorization: boolean("contact_authorization").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Children-Guardians relationship table
export const childrenGuardians = pgTable("children_guardians", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: uuid("child_id").references(() => children.id),
  guardianId: uuid("guardian_id").references(() => guardians.id),
  isPrimary: boolean("is_primary").default(false),
});

// Classes table
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  room: varchar("room", { length: 50 }),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Class meetings table
export const classMeetings = pgTable("class_meetings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: uuid("class_id").references(() => classes.id),
  date: date("date").notNull(),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Worship services table
export const worshipServices = pgTable("worship_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  description: varchar("description", { length: 255 }),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Class attendance table
export const classAttendance = pgTable("class_attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classMeetingId: uuid("class_meeting_id").references(() => classMeetings.id),
  childId: uuid("child_id").references(() => children.id),
  status: varchar("status", { length: 20 }).notNull(), // presente, ausente
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Worship attendance table
export const worshipAttendance = pgTable("worship_attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  worshipServiceId: uuid("worship_service_id").references(() => worshipServices.id),
  childId: uuid("child_id").references(() => children.id),
  status: varchar("status", { length: 20 }).notNull(), // presente, ausente
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meditation weeks table
export const meditationWeeks = pgTable("meditation_weeks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  weekReference: varchar("week_reference", { length: 50 }).notNull(), // 2024-W01
  theme: varchar("theme", { length: 255 }).notNull(),
  materialLink: text("material_link"),
  allowsAttachments: boolean("allows_attachments").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meditation deliveries table
export const meditationDeliveries = pgTable("meditation_deliveries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: uuid("child_id").references(() => children.id),
  meditationWeekId: uuid("meditation_week_id").references(() => meditationWeeks.id),
  status: varchar("status", { length: 20 }).notNull(), // entregou, nao_entregou, em_andamento
  deliveryDate: date("delivery_date"),
  evidenceUrl: varchar("evidence_url"),
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bible verses table
export const bibleVerses = pgTable("bible_verses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: varchar("reference", { length: 100 }).notNull(), // Sl 119:105
  text: text("text").notNull(),
  weekReference: varchar("week_reference", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verse memorization table
export const verseMemorizations = pgTable("verse_memorizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: uuid("child_id").references(() => children.id),
  bibleVerseId: uuid("bible_verse_id").references(() => bibleVerses.id),
  status: varchar("status", { length: 20 }).notNull(), // memorizou, em_andamento, nao_memorizou
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes table
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: uuid("child_id").references(() => children.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().default([]), // comportamento, saude, familia, espiritual, elogio
  attentionLevel: varchar("attention_level", { length: 20 }).notNull(), // baixa, media, alta
  reminderDate: date("reminder_date"),
  isSensitive: boolean("is_sensitive").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message templates table
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  bodyTemplate: text("body_template").notNull(),
  supportedVariables: text("supported_variables").array().default([]),
  isActive: boolean("is_active").default(true),
  category: varchar("category", { length: 50 }).notNull(), // falta, meditacao, culto, incentivo, boas_vindas, pastoral, aviso
  createdAt: timestamp("created_at").defaultNow(),
});

// Message sends table
export const messageSends = pgTable("message_sends", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: uuid("child_id").references(() => children.id),
  guardianId: uuid("guardian_id").references(() => guardians.id),
  messageTemplateId: uuid("message_template_id").references(() => messageTemplates.id),
  channel: varchar("channel", { length: 20 }).default("whatsapp"),
  generatedMessage: text("generated_message").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  sentBy: varchar("sent_by").references(() => users.id),
});

// Audit log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id"),
  payloadSummary: jsonb("payload_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  messageSends: many(messageSends),
  auditLogs: many(auditLogs),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  class: one(classes, {
    fields: [children.classId],
    references: [classes.id],
  }),
  guardians: many(childrenGuardians),
  classAttendance: many(classAttendance),
  worshipAttendance: many(worshipAttendance),
  meditationDeliveries: many(meditationDeliveries),
  verseMemorizations: many(verseMemorizations),
  notes: many(notes),
  messageSends: many(messageSends),
}));

export const guardiansRelations = relations(guardians, ({ many }) => ({
  children: many(childrenGuardians),
  messageSends: many(messageSends),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  children: many(children),
  classMeetings: many(classMeetings),
}));

export const classMeetingsRelations = relations(classMeetings, ({ one, many }) => ({
  class: one(classes, {
    fields: [classMeetings.classId],
    references: [classes.id],
  }),
  attendance: many(classAttendance),
}));

export const worshipServicesRelations = relations(worshipServices, ({ many }) => ({
  attendance: many(worshipAttendance),
}));

export const meditationWeeksRelations = relations(meditationWeeks, ({ many }) => ({
  deliveries: many(meditationDeliveries),
}));

export const bibleVersesRelations = relations(bibleVerses, ({ many }) => ({
  memorizations: many(verseMemorizations),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ many }) => ({
  sends: many(messageSends),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuardianSchema = createInsertSchema(guardians).omit({
  id: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type ClassAttendance = typeof classAttendance.$inferSelect;
export type WorshipAttendance = typeof worshipAttendance.$inferSelect;
export type MeditationDelivery = typeof meditationDeliveries.$inferSelect;
export type VerseMemorization = typeof verseMemorizations.$inferSelect;
export type MessageSend = typeof messageSends.$inferSelect;
