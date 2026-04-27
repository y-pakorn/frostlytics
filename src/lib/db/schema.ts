import {
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
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

export const backfillLog = pgTable(
  "backfill_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetDate: timestamp("target_date").notNull(),
    status: varchar("status", { length: 10 }).notNull(), // 'success' | 'failure' | 'skipped'
    durationMs: integer("duration_ms").notNull(),
    checkpoint: integer("checkpoint"),
    epoch: integer("epoch"),
    rawData: jsonb("raw_data"),
    error: varchar("error", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_bl__target_date").on(table.targetDate)]
)

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull(),
    checkpoint: integer("checkpoint"),
    metric: varchar("metric", { length: 64 }).notNull(),
    frostlyticsValue: doublePrecision("frostlytics_value"),
    referenceValue: doublePrecision("reference_value"),
    delta: doublePrecision("delta"),
    deltaPct: doublePrecision("delta_pct"),
    source: varchar("source", { length: 64 }).notNull(),
    referenceQuery: text("reference_query").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_al__timestamp").on(table.timestamp),
    index("idx_al__metric_timestamp").on(table.metric, table.timestamp),
  ]
)

export const grossProtocolRevenue = pgTable(
  "gross_protocol_revenue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull().unique(),
    fromCheckpoint: integer("from_checkpoint").notNull(),
    toCheckpoint: integer("to_checkpoint").notNull(),
    fromEpoch: integer("from_epoch").notNull(),
    toEpoch: integer("to_epoch").notNull(),
    grossInflowWAL: doublePrecision("gross_inflow_wal").notNull(),
    poolDrainWAL: doublePrecision("pool_drain_wal"),
    poolFundingWAL: doublePrecision("pool_funding_wal"),
    fixedRateSubsidyWAL: doublePrecision("fixed_rate_subsidy_wal"),
    usageSubsidyWAL: doublePrecision("usage_subsidy_wal"),
    userFeeWAL: doublePrecision("user_fee_wal"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_gpr__timestamp").on(table.timestamp)]
)
