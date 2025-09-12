CREATE INDEX "idx_ad_timestamp" ON "aggregated_daily" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_od_timestamp" ON "operator_daily" USING btree ("timestamp");