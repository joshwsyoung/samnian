ALTER TABLE "users" ADD COLUMN "founders_number" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_founders_number_unique" UNIQUE("founders_number");