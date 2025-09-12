DROP INDEX "idx_ad_timestamp";--> statement-breakpoint
CREATE INDEX "idx_ad__timestamp" ON "aggregated_daily" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_od_operator_id" ON "operator_daily" USING btree ("operator_id");