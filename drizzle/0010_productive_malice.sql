CREATE TABLE "backfill_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_date" timestamp NOT NULL,
	"status" varchar(10) NOT NULL,
	"duration_ms" integer NOT NULL,
	"raw_data" jsonb,
	"error" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_bl__target_date" ON "backfill_log" USING btree ("target_date");