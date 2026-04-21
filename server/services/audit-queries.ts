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

// Lean: template name + variables. Full query body + jq navigation convention
// documented once in /api/audit/queries.
const buildSuiObjectCall = (objectId: string, checkpoint: number) =>
  `${SUI_OBJECT_QUERY_NAME}(objectId=${objectId},beforeCheckpoint=${checkpoint + 1})`

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
    buildHttpCall: () => `GET api.llama.fi/summary/fees/walrus-protocol`,
  },
}

// jq is applied to the Move object's `contents.json` — the full navigation prefix
// (data.transactions.nodes[0]...asMoveObject.contents.json) is fixed and documented
// in /api/audit/queries. Keep jq expressions short and self-contained.
export interface MetricDef {
  source: AuditSourceKey
  dbColumn: string
  perOperator: boolean
  jq: string
}

export const METRIC_DEFS: Record<string, MetricDef> = {
  operatorCount: {
    source: "sui_graphql:stakingInner",
    dbColumn: "aggregated_daily.operator_count",
    perOperator: false,
    jq: `.value.pools.size | tonumber`,
  },
  activeCount: {
    source: "sui_graphql:activeSet",
    dbColumn: "aggregated_daily.active_count",
    perOperator: false,
    jq: `.value.nodes | length`,
  },
  committeeCount: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.committee_count",
    perOperator: false,
    jq: `.value.committee.members | length`,
  },
  nShard: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.n_shard",
    perOperator: false,
    jq: `.value.committee.n_shards | tonumber`,
  },
  totalStakedWAL: {
    source: "sui_graphql:activeSet",
    dbColumn: "aggregated_daily.total_staked_wal",
    perOperator: false,
    jq: `.value.total_stake | tonumber * 1e-9`,
  },
  averageStakedWAL: {
    source: "sui_graphql:activeSet",
    dbColumn: "aggregated_daily.average_staked_wal",
    perOperator: false,
    jq: `[(.value.nodes[] | .staked_amount | tonumber * 1e-9)] | add / length`,
  },
  storageUsageTB: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.storage_usage_tb",
    perOperator: false,
    jq: `.value.used_capacity_size | tonumber * 1e-12`,
  },
  totalStorageTB: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.total_storage_tb",
    perOperator: false,
    jq: `.value.total_capacity_size | tonumber * 1e-12`,
  },
  storagePrice: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.storage_price",
    perOperator: false,
    jq: `.value.storage_price_per_unit_size | tonumber`,
  },
  writePrice: {
    source: "sui_graphql:systemInner",
    dbColumn: "aggregated_daily.write_price",
    perOperator: false,
    jq: `.value.write_price_per_unit_size | tonumber`,
  },
  paidFeesUSD: {
    source: "defillama:walrus-protocol",
    dbColumn: "aggregated_daily.paid_fees_usd",
    perOperator: false,
    jq: `.totalDataChart[] | select(.[0] == <unix>) | .[1]`,
  },
  "per_operator.stakedWAL": {
    source: "sui_graphql:activeSet",
    dbColumn: `operator_daily.staked_wal[op=<op>,ts=<date>]`,
    perOperator: true,
    jq: `.value.nodes[] | select(.node_id == "<op>") | .staked_amount | tonumber * 1e-9`,
  },
  "per_operator.weight": {
    source: "sui_graphql:systemInner",
    dbColumn: `operator_daily.weight[op=<op>,ts=<date>]`,
    perOperator: true,
    jq: `.value.committee.members[] | select(.node_id == "<op>") | .weight | tonumber`,
  },
  "per_operator.weightPercentage": {
    source: "sui_graphql:systemInner",
    dbColumn: `operator_daily.weight_percentage[op=<op>,ts=<date>]`,
    perOperator: true,
    jq: `(.value.committee.members[] | select(.node_id == "<op>") | .weight | tonumber) / (.value.committee.n_shards | tonumber)`,
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

// Compact single-line format: <http_call> :: <jq> :: db=<column>
// Full query template + jq navigation prefix convention documented in /api/audit/queries.
export const buildReferenceQuery = (ctx: ReferenceQueryContext): string => {
  const def = METRIC_DEFS[ctx.metric]
  if (!def) throw new Error(`Unknown audit metric: ${ctx.metric}`)
  const src = AUDIT_SOURCES[def.source]

  const jq =
    def.source === "defillama:walrus-protocol"
      ? def.jq.replace(
          "<unix>",
          String(Math.floor(new Date(`${ctx.date}T00:00:00Z`).valueOf() / 1000))
        )
      : def.perOperator && ctx.operatorId
        ? def.jq.replaceAll("<op>", ctx.operatorId)
        : def.jq

  const httpCall = src.buildHttpCall({
    checkpoint: ctx.checkpoint ?? 0,
    date: ctx.date,
  })

  const dbColumn = def.dbColumn
    .replace("<op>", ctx.operatorId ?? "<op>")
    .replace("<date>", ctx.date)

  return `${httpCall} :: ${jq} :: db=${dbColumn}`
}

export const buildNotes = (ctx: ReferenceQueryContext): string => {
  if (ctx.operatorId) return `operatorId=${ctx.operatorId}`
  return ""
}
