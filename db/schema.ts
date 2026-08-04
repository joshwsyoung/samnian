import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  real,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// --- Enums -------------------------------------------------------------

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const themeEnum = pgEnum("theme", ["light", "dark"]);
export const priceLevelEnum = pgEnum("price_level", ["£", "££", "£££"]);
export const slotEnum = pgEnum("slot", [
  "12:00",
  "13:00",
  "14:00",
  "18:00",
  "19:00",
  "20:00",
]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
]);
export const traitEnum = pgEnum("trait", ["O", "C", "E", "A", "N"]);
export const answerTypeEnum = pgEnum("answer_type", ["single", "multiple"]);

// --- Users & auth --------------------------------------------------------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  age: integer("age"),
  city: text("city"),
  priceLevel: priceLevelEnum("price_level"),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  theme: themeEnum("theme").notNull().default("light"),
  profileImage: text("profile_image"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
]);

export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("password_reset_codes_token_idx").on(table.token),
]);

// --- Interests -------------------------------------------------------------

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
}, (table) => [
  uniqueIndex("interests_name_idx").on(table.name),
]);

export const userInterests = pgTable("user_interests", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  interestId: integer("interest_id").notNull().references(() => interests.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.interestId] }),
]);

// --- OCEAN personality test --------------------------------------------

export const personalityTests = pgTable("personality_tests", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answerType: answerTypeEnum("answer_type").notNull().default("single"),
  options: jsonb("options").$type<{ value: number; label: string }[]>().notNull(),
  trait: traitEnum("trait").notNull(),
  reverse: boolean("reverse").notNull().default(false),
  required: boolean("required").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const personalityScores = pgTable("personality_scores", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  openness: real("openness").notNull(),
  conscientiousness: real("conscientiousness").notNull(),
  extraversion: real("extraversion").notNull(),
  agreeableness: real("agreeableness").notNull(),
  neuroticism: real("neuroticism").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Availability & matching ---------------------------------------------

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventDate: date("event_date").notNull(),
  slot: slotEnum("slot").notNull(),
}, (table) => [
  uniqueIndex("availability_user_id_idx").on(table.userId),
]);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  eventDate: date("event_date").notNull(),
  slot: slotEnum("slot").notNull(),
  priceLevel: priceLevelEnum("price_level").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchUsers = pgTable("match_users", {
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.matchId, table.userId] }),
]);

// --- Chat ------------------------------------------------------------------

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchId: integer("match_id").references(() => matches.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationUsers = pgTable("conversation_users", {
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: inviteStatusEnum("status").notNull().default("pending"),
}, (table) => [
  primaryKey({ columns: [table.conversationId, table.userId] }),
]);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
