CREATE TYPE "public"."answer_type" AS ENUM('single', 'multiple');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."price_level" AS ENUM('£', '££', '£££');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."slot" AS ENUM('12:00', '13:00', '14:00', '18:00', '19:00', '20:00');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."trait" AS ENUM('O', 'C', 'E', 'A', 'N');--> statement-breakpoint
CREATE TABLE "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_date" date NOT NULL,
	"slot" "slot" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer,
	"message" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_users" (
	"conversation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "conversation_users_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"user_id" integer NOT NULL,
	"match_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_users" (
	"match_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "match_users_match_id_user_id_pk" PRIMARY KEY("match_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_date" date NOT NULL,
	"slot" "slot" NOT NULL,
	"price_level" "price_level" NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personality_scores" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"openness" real NOT NULL,
	"conscientiousness" real NOT NULL,
	"extraversion" real NOT NULL,
	"agreeableness" real NOT NULL,
	"neuroticism" real NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personality_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer_type" "answer_type" DEFAULT 'single' NOT NULL,
	"options" jsonb NOT NULL,
	"trait" "trait" NOT NULL,
	"reverse" boolean DEFAULT false NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"user_id" integer NOT NULL,
	"interest_id" integer NOT NULL,
	CONSTRAINT "user_interests_user_id_interest_id_pk" PRIMARY KEY("user_id","interest_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"age" integer,
	"city" text,
	"price_level" "price_level",
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"theme" "theme" DEFAULT 'light' NOT NULL,
	"profile_image" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_users" ADD CONSTRAINT "conversation_users_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_users" ADD CONSTRAINT "conversation_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_users" ADD CONSTRAINT "match_users_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_users" ADD CONSTRAINT "match_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personality_scores" ADD CONSTRAINT "personality_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_user_id_idx" ON "availability" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interests_name_idx" ON "interests" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_codes_token_idx" ON "password_reset_codes" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");