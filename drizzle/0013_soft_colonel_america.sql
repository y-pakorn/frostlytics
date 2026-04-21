CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp NOT NULL,
	"checkpoint" integer,
	"metric" varchar(64) NOT NULL,
	"frostlytics_value" double precision,
	"reference_value" double precision,
	"delta" double precision,
	"delta_pct" double precision,
	"source" varchar(64) NOT NULL,
	"reference_query" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_al__timestamp" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_al__metric_timestamp" ON "audit_log" USING btree ("metric","timestamp");