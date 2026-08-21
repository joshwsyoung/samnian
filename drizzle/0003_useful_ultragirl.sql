ALTER TABLE "samnian_events" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "samnian_events" ADD COLUMN "cuisine" text;