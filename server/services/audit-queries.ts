import { walrus } from "../../src/config/walrus"

export type AuditSourceKey =
  | "sui_graphql:systemInner"
  | "sui_graphql:stakingInner"
  | "sui_graphql:activeSet"
  | "defillama:walrus-protocol"

export const SUI_GRAPHQL_ENDPOINT = "https://graphql.mainnet.sui.io/graphql"
export const SUI_OBJECT_QUERY_NAME = "getTransactionAffectedObject"
export const SUI_OBJECT_QUERY_BODY = `query getTransactionAffectedObject($beforeCheckpoint: Int, $objectId: String) { transactions(filter: { affectedObject: $objectId, beforeCheckpoint: $beforeCheckpoint }, last: 1) { nodes { digest effects { objectChanges { nodes { address outputState { address asMoveObject { contents { type { repr } json } } } } } } } } }`

interface SourceDef {
  source: AuditSourceKey
  objectId: string | null
  description: string
  buildHttpCall: (ctx: { checkpoint?: number; date?: string }) => string
}

// Lean: template name + variables only. Full query body is fixed and
// documented once in /api/audit/queries.md — no need to repeat it per row.
const buildSuiObjectCall = (objectId: string, checkpoint: number) =>
  `SuiGraphQL ${SUI_OBJECT_QUERY_NAME} objectId=${objectId} beforeCheckpoint=${checkpoint + 1}`

export const AUDIT_SOURCES: Record<AuditSourceKey, SourceDef> = {
  "sui_graphql:systemInner": {
    source: "sui_graphql:systemInner",
    objectId: walrus.backfill.systemInner,
    description:
      "SystemStateInner Move struct — committee membership, shard count, storage capacity, prices.",
    buildHttpCall: ({ checkpoint }) =>
      buildSuiObjectCall(walrus.backfill.systemInner, checkpoint ?? 0),
  },
  "sui_graphql:stakingInner": {
    source: "sui_graphql:stakingInner",
    objectId: walrus.backfill.stakingInner,
    description:
      "StakingInner Move struct — total pool (operator) count via pools.size.",
    buildHttpCall: ({ checkpoint }) =>
      buildSuiObjectCall(walrus.backfill.stakingInner, checkpoint ?? 0),
  },
  "sui_graphql:activeSet": {
    source: "sui_graphql:activeSet",
    objectId: walrus.backfill.activeSet,
    description:
      "ActiveSet Move struct — total_stake (network), nodes[] (per-operator stake).",
    buildHttpCall: ({ checkpoint }) =>
      buildSuiObjectCall(walrus.backfill.activeSet, checkpoint ?? 0),
  },
  "defillama:walrus-protocol": {
    source: "defillama:walrus-protocol",
    objectId: null,
    description:
      "DefiLlama aggregated fee indexer for Walrus. totalDataChart is [unixSeconds, feesUSD] pairs.",
    buildHttpCall: () => `GET https://api.llama.fi/summary/fees/walrus-protocol`,
  },
}

export interface MetricDef {
  source: AuditSourceKey
  dbColumn: string
  perOperator: boolean
  extractPath: string
  decoding: string
}

const MOVE_JSON_ROOT = `data.transactions.nodes[0].effects.objectChanges.nodes[*].outputState.asMoveObject.contents`

export const METRIC_DEFS: Record<string, MetricDef> = {
  operatorCount: {
    source: "sui_graphql:stakingInner",
    dbColumn: "aggregated_daily.operator_count",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::StakingInner")) | .json.value.pools.size`,
    decoding: "parseInt(result) — integer count of staking pools.",
  },
  activeCount: {
    source: "sui_graphql:activeSet",
    dbColumn: "aggregated_daily.active_count",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::ActiveSet")) | .json.value.nodes | length`,
    decoding: "Array length of active nodes.",
  },
  committeeCount: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.committee_count",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.committee.members | length`,
    decoding: "Array length of committee.members[].",
  },
  nShard: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.n_shard",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.committee.n_shards`,
    decoding: "parseInt(result) — total shard count.",
  },
  totalStakedWAL: {
    source: "sui_graphql:activeSet",
    dbColumn: "aggregated_daily.total_staked_wal",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::ActiveSet")) | .json.value.total_stake`,
    decoding:
      "BigNumber(result) * 10^-9 — WAL has 9 decimals; result is base units.",
  },
  averageStakedWAL: {
    source: "sui_graphql:activeSet",
    dbColumn: "aggregated_daily.average_staked_wal",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::ActiveSet")) | .json.value.nodes[].staked_amount`,
    decoding:
      "Decode each nodes[].staked_amount via BigNumber * 10^-9, union with systemInner committee.members[], then mean over the union (matches _.meanBy(uniqueNodeIds, 'stakedWal') in backfill-compute.ts).",
  },
  storageUsageTB: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.storage_usage_tb",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.used_capacity_size`,
    decoding:
      "BigNumber(result) * 10^-12 — convert bytes to terabytes (Walrus capacity uses base units shifted by 12).",
  },
  totalStorageTB: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.total_storage_tb",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.total_capacity_size`,
    decoding: "BigNumber(result) * 10^-12 — same convention as storageUsageTB.",
  },
  storagePrice: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.storage_price",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.storage_price_per_unit_size`,
    decoding: "parseFloat(result) — on-chain raw unit (no decimal shift).",
  },
  writePrice: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.write_price",
    perOperator: false,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.write_price_per_unit_size`,
    decoding: "parseFloat(result) — on-chain raw unit (no decimal shift).",
  },
  paidFeesUSD: {
    source: "defillama:walrus-protocol",
    dbColumn: "aggregated_daily.paid_fees_usd",
    perOperator: false,
    extractPath: `.totalDataChart[] | select(.[0] == <unix_seconds_of_utc_day>) | .[1]`,
    decoding:
      "Numeric USD. If the exact unix_seconds is missing for the day, backfill falls back to the last entry's value (lastFee).",
  },
  "per_operator.stakedWAL": {
    source: "sui_graphql:activeSet",
    dbColumn:
      "operator_daily.staked_wal WHERE operator_id = <operatorId> AND timestamp = <date>",
    perOperator: true,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::ActiveSet")) | .json.value.nodes[] | select(.node_id == "<operatorId>") | .staked_amount`,
    decoding:
      "BigNumber(result) * 10^-9. If the operator is only in committee.members[] but not in activeSet.nodes[], the DB value for stakedWAL will be 0 (matches backfill-compute.ts stakedWalMap lookup).",
  },
  "per_operator.weight": {
    source: "sui_graphql:systemInner",
    dbColumn:
      "operator_daily.weight WHERE operator_id = <operatorId> AND timestamp = <date>",
    perOperator: true,
    extractPath: `${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.committee.members[] | select(.node_id == "<operatorId>") | .weight`,
    decoding:
      "parseInt(result) — weight equals shard count assigned to that operator. Operators not in committee.members[] get weight=0.",
  },
  "per_operator.weightPercentage": {
    source: "sui_graphql:systemInner",
    dbColumn:
      "operator_daily.weight_percentage WHERE operator_id = <operatorId> AND timestamp = <date>",
    perOperator: true,
    extractPath: `(${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.committee.members[] | select(.node_id == "<operatorId>") | .weight) / (${MOVE_JSON_ROOT} | select(.type.repr | contains("::SystemStateInner")) | .json.value.committee.n_shards)`,
    decoding:
      "weight / n_shards. Not a percentage despite the name — it's a fraction in [0, 1].",
  },
}

export const SOURCE_FOR_METRIC = (metric: string): AuditSourceKey => {
  const def = METRIC_DEFS[metric]
  if (!def) throw new Error(`Unknown audit metric: ${metric}`)
  return def.source
}

export interface ReferenceQueryContext {
  metric: string
  checkpoint: number | null
  date: string // YYYY-MM-DD
  operatorId?: string
}

// Keeps full derivation detail (HTTP body, extract, decoding, DB column) for
// per-row reproducibility but omits metric/source/checkpoint/date — those are
// already their own CSV columns and don't need to be repeated in the body.
export const buildReferenceQuery = (ctx: ReferenceQueryContext): string => {
  const def = METRIC_DEFS[ctx.metric]
  if (!def) throw new Error(`Unknown audit metric: ${ctx.metric}`)
  const src = AUDIT_SOURCES[def.source]

  const extract =
    def.source === "defillama:walrus-protocol"
      ? def.extractPath.replace(
          "<unix_seconds_of_utc_day>",
          String(Math.floor(new Date(`${ctx.date}T00:00:00Z`).valueOf() / 1000))
        )
      : def.perOperator && ctx.operatorId
        ? def.extractPath.replaceAll("<operatorId>", ctx.operatorId)
        : def.extractPath

  const httpCall = src.buildHttpCall({
    checkpoint: ctx.checkpoint ?? 0,
    date: ctx.date,
  })

  const dbColumn = def.dbColumn
    .replace("<operatorId>", ctx.operatorId ?? "<operatorId>")
    .replace("<date>", ctx.date)

  return [
    `# HTTP`,
    httpCall,
    ``,
    `# Extract (jq)`,
    extract,
    ``,
    `# Decode`,
    def.decoding,
    ``,
    `# DB side`,
    dbColumn,
  ].join("\n")
}

export const buildNotes = (ctx: ReferenceQueryContext): string => {
  if (ctx.operatorId) return `operatorId=${ctx.operatorId}`
  return ""
}
