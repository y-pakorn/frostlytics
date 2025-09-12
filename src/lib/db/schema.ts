import {
  doublePrecision,
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
    sequenceNumber: integer("sequence_number").notNull(),
    epoch: integer("epoch"),
    activeCount: integer("active_count"),
    committeeCount: integer("committee_count"),
    operatorCount: integer("operator_count"),
    nShard: integer("n_shard"),
    totalStakedWAL: doublePrecision("total_staked_wal"),
    averageStakedWAL: doublePrecision("average_staked_wal"),
    storageUsageTB: doublePrecision("storage_usage_tb"),
    totalStorageTB: doublePrecision("total_storage_tb"),
    storagePrice: integer("storage_price"),
    writePrice: integer("write_price"),
    paidFeesUSD: doublePrecision("paid_fees_usd"),
  },
  (table) => [index("idx_ad__timestamp").on(table.timestamp)]
)

export const operatorDaily = pgTable(
  "operator_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorId: varchar("operator_id", { length: 66 }).notNull(), //0x...
    epoch: integer("epoch"),
    timestamp: timestamp("timestamp").notNull(),
    stakedWAL: doublePrecision("staked_wal"),
    weight: integer("weight"),
    weightPercentage: doublePrecision("weight_percentage"),
  },
  (table) => [
    index("idx_od_operator_id").on(table.operatorId),
    index("idx_od_timestamp").on(table.timestamp),
  ]
)
