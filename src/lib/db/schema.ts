import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const aggregatedDaily = pgTable(
  "aggregated_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull(),
    activeCount: integer("active_count"),
    committeeCount: integer("committee_count"),
    nShard: integer("n_shard"),
    stakedWAL: numeric("staked_wal"),
    storageUsageTB: numeric("storage_usage_tb"),
    totalStorageTB: numeric("total_storage_tb"),
    paidFeesUSD: numeric("paid_fees_usd"),
  },
  (table) => [index("idx_ad__timestamp").on(table.timestamp)]
)

export const operatorDaily = pgTable(
  "operator_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorId: varchar("operator_id", { length: 66 }).notNull(), //0x...
    timestamp: timestamp("timestamp").notNull(),
    stakedWAL: numeric("staked_wal"),
    weight: integer("weight"),
  },
  (table) => [
    index("idx_od_operator_id").on(table.operatorId),
    index("idx_od_timestamp").on(table.timestamp),
  ]
)
