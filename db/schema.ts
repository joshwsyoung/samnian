import {
  pgTable,
  pgSchema,
  pgEnum,
  serial,
  uuid,
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

// Supabase's own `auth.users` table lives outside our migrations — this is
// just enough of it (declared, not created) for FK references and joins.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// --- Enums -------------------------------------------------------------

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const priceTierEnum = pgEnum("price_tier", ["broke", "modest", "fun", "baller"]);
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

// --- Users -----------------------------------------------------------------
// Identity (email, password, verification, sessions) lives in Supabase
// Auth's `auth.users`. This table is this app's profile/app-data for that
// same user, keyed by the same id — created on first sign-in, not on
// signUp, since Supabase Auth is the source of truth for "does this user
// exist" now.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  age: integer("age"),
  city: text("city"),
  role: roleEnum("role").notNull().default("user"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
]);

// --- Interests -------------------------------------------------------------

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
}, (table) => [
  uniqueIndex("interests_name_idx").on(table.name),
]);

export const userInterests = pgTable("user_interests", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  interestId: integer("interest_id").notNull().references(() => interests.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.interestId] }),
]);

// --- OCEAN personality test --------------------------------------------
// Completing this is mandatory before a user can express interest in an
// event — see requireCompletedOceanTest() in lib/auth.ts.

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
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  openness: real("openness").notNull(),
  conscientiousness: real("conscientiousness").notNull(),
  extraversion: real("extraversion").notNull(),
  agreeableness: real("agreeableness").notNull(),
  neuroticism: real("neuroticism").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Events ------------------------------------------------------------
// A browsable dinner event tied to one restaurant. Admin-created (see
// /admin/events); users who've completed the OCEAN test can express
// interest in one (see eventInterest below), and the admin later curates
// interested users into small dinner groups.

// Table names are prefixed samnian_* — this Supabase project is shared
// with an unrelated app that already owns unprefixed `events` /
// `event_interest` tables (a different schema entirely: EOI/ticketing
// fields like slug, season, price_pp — nothing to do with this app).
export const events = pgTable("samnian_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  restaurantUrl: text("restaurant_url"),
  imageUrl: text("image_url"),
  // Extra gallery photos for the detail page, beyond imageUrl (which stays
  // the card/hero image so existing events with only that set still work).
  images: jsonb("images").$type<string[]>().notNull().default([]),
  cuisine: text("cuisine"),
  address: text("address"),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  slot: slotEnum("slot").notNull(),
  capacity: integer("capacity"),
  // Only published events are shown to users to opt into — lets an admin
  // stage an event (restaurant, photo, copy) before it goes live.
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A user opting into a specific event, with the budget tier they're
// comfortable with for that night out. Replaces the old single global
// `availability` row + `users.priceLevel` — preference is per event now,
// since someone might be up for a £0 night out one week and splashing out
// the next.
export const eventInterest = pgTable("samnian_event_interest", {
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  priceTier: priceTierEnum("price_tier").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.eventId, table.userId] }),
]);

// --- Groups (the actual dinner table) -----------------------------------
// Admin-curated subset of an event's interested users. A chat conversation
// only ever gets created for a group, once the admin has finished building
// its member list — see app/messages.

export const groups = pgTable("samnian_groups", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable("samnian_group_members", {
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.groupId, table.userId] }),
]);

// --- Chat ------------------------------------------------------------------

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: integer("group_id").references(() => groups.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationUsers = pgTable("conversation_users", {
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: inviteStatusEnum("status").notNull().default("pending"),
}, (table) => [
  primaryKey({ columns: [table.conversationId, table.userId] }),
]);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
