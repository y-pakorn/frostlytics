import { and, asc, desc, gte, like, lte, SQL } from "drizzle-orm"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"

import { auditLog } from "../../src/lib/db/schema"
import { db } from "../db"
import {
  AUDIT_SOURCES,
  buildReferenceQuery,
  METRIC_DEFS,
  SUI_GRAPHQL_ENDPOINT,
  SUI_OBJECT_QUERY_BODY,
  SUI_OBJECT_QUERY_NAME,
} from "../services/audit-queries"

const CSV_COLUMNS = [
  "created_at",
  "timestamp",
  "checkpoint",
  "metric",
  "frostlytics_value",
  "reference_value",
  "delta",
  "delta_pct",
  "source",
  "reference_query",
  "notes",
] as const

const csvEscape = (v: unknown): string => {
  if (v == null) return ""
  const s = String(v)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const toCsv = (
  rows: Array<{
    createdAt: Date
    timestamp: Date
    checkpoint: number | null
    metric: string
    frostlyticsValue: number | null
    referenceValue: number | null
    delta: number | null
    deltaPct: number | null
    source: string
    referenceQuery: string
    notes: string | null
  }>
): string => {
  const lines = [CSV_COLUMNS.join(",")]
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.createdAt.toISOString()),
        csvEscape(r.timestamp.toISOString()),
        csvEscape(r.checkpoint),
        csvEscape(r.metric),
        csvEscape(r.frostlyticsValue),
        csvEscape(r.referenceValue),
        csvEscape(r.delta),
        csvEscape(r.deltaPct),
        csvEscape(r.source),
        csvEscape(r.referenceQuery),
        csvEscape(r.notes),
      ].join(",")
    )
  }
  return lines.join("\n") + "\n"
}

const buildConditions = (query: {
  from?: string
  to?: string
  metric?: string
}): SQL | undefined => {
  const conditions: SQL[] = []
  if (query.from) conditions.push(gte(auditLog.timestamp, new Date(query.from)))
  if (query.to) conditions.push(lte(auditLog.timestamp, new Date(query.to)))
  if (query.metric) {
    if (query.metric.endsWith("*")) {
      const prefix = query.metric.slice(0, -1)
      conditions.push(like(auditLog.metric, `${prefix}%`))
    } else {
      conditions.push(eq(auditLog.metric, query.metric))
    }
  }
  return conditions.length ? and(...conditions) : undefined
}

const defaultWindow = () => {
  const to = new Date()
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}

const renderQueriesPlain = (): string => {
  const L: string[] = []
  L.push("FROSTLYTICS AUDIT — REFERENCE QUERIES")
  L.push("=====================================")
  L.push("")
  L.push(
    "Every row in /api/audit/csv has reference_query in the form:"
  )
  L.push("")
  L.push("  <http_call> :: <jq> :: db=<column>")
  L.push("")
  L.push(
    "The audit pins each row to the checkpoint recorded in aggregated_daily.sequence_number for that day. `beforeCheckpoint` in the GraphQL query is checkpoint+1 so the returned object reflects state at the checkpoint."
  )
  L.push("")

  L.push("SUI GRAPHQL CALL TEMPLATE")
  L.push("-------------------------")
  L.push("")
  L.push(
    `<http_call> = ${SUI_OBJECT_QUERY_NAME}(objectId=<OBJ>,beforeCheckpoint=<N+1>) resolves to a POST against ${SUI_GRAPHQL_ENDPOINT} with this GraphQL body:`
  )
  L.push("")
  L.push(SUI_OBJECT_QUERY_BODY)
  L.push("")
  L.push(
    "jq in each row is applied to the response narrowed to the Move object's JSON, i.e. start from:"
  )
  L.push("")
  L.push(
    "  .data.transactions.nodes[0].effects.objectChanges.nodes[*].outputState.asMoveObject.contents.json"
  )
  L.push("")
  L.push(
    "(So .value in the jq expressions refers to that object's fields.)"
  )
  L.push("")
  L.push("Curl recipe to reproduce any row:")
  L.push("")
  L.push(
    `  curl -s ${SUI_GRAPHQL_ENDPOINT} -H 'Content-Type: application/json' \\`
  )
  L.push(
    `    -d '{"query":"<template above>","variables":{"objectId":"<OBJ>","beforeCheckpoint":<N+1>}}' \\`
  )
  L.push(
    `    | jq '.data.transactions.nodes[0].effects.objectChanges.nodes[] | .outputState.asMoveObject.contents.json | <jq from row>'`
  )
  L.push("")

  L.push("SOURCES")
  L.push("-------")
  L.push("")
  for (const src of Object.values(AUDIT_SOURCES)) {
    L.push(`${src.source}`)
    if (src.objectId) L.push(`  objectId: ${src.objectId}`)
    L.push(`  ${src.description}`)
    L.push("")
  }

  L.push("METRICS")
  L.push("-------")
  L.push("")
  for (const [metric, def] of Object.entries(METRIC_DEFS)) {
    L.push(metric)
    L.push(`  source: ${def.source}`)
    L.push(`  jq: ${def.jq}`)
    L.push(`  db: ${def.dbColumn}`)
    L.push("")
  }

  L.push("DEFILLAMA")
  L.push("---------")
  L.push("")
  L.push(
    "Rows with source=defillama:walrus-protocol use GET api.llama.fi/summary/fees/walrus-protocol. jq runs on the response root. <unix> in the jq is the UTC midnight of the audited date in unix seconds."
  )
  L.push("")

  L.push("COMMISSION (not historically audited)")
  L.push("-------------------------------------")
  L.push("")
  L.push(
    "Commission rate is not stored per operator per day. For a current-state spot check, call sui_multiGetObjects with the pool object ID and read content.fields.commission_rate (divide by 10,000 for decimal rate)."
  )
  L.push("")
  return L.join("\n")
}

export const auditRoutes = new Elysia({ tags: ["Audit"] })
  .get(
    "/api/audit/csv",
    async ({ query, set }) => {
      const rng = {
        from: query.from ?? defaultWindow().from,
        to: query.to ?? defaultWindow().to,
        metric: query.metric,
      }
      const rows = await db
        .select()
        .from(auditLog)
        .where(buildConditions(rng))
        .orderBy(desc(auditLog.createdAt), desc(auditLog.timestamp), asc(auditLog.metric))
        .limit(parseInt(query.limit || "500000"))

      set.headers["content-type"] = "text/csv; charset=utf-8"
      set.headers["content-disposition"] =
        `attachment; filename=\"frostlytics-audit-${rng.from.slice(0, 10)}_${rng.to.slice(0, 10)}.csv\"`
      return toCsv(rows)
    },
    {
      query: t.Object({
        from: t.Optional(
          t.String({
            format: "date",
            description:
              "Start of window (inclusive). ISO 8601 date. Default: 30 days ago.",
          })
        ),
        to: t.Optional(
          t.String({
            format: "date",
            description:
              "End of window (inclusive). ISO 8601 date. Default: now.",
          })
        ),
        metric: t.Optional(
          t.String({
            description:
              "Optional metric filter. Exact match (e.g. 'totalStakedWAL') or trailing '*' for prefix (e.g. 'per_operator.*').",
          })
        ),
        limit: t.Optional(
          t.String({
            description: "Max rows returned (default 500000).",
          })
        ),
      }),
      detail: {
        tags: ["Audit"],
        summary: "Reconciliation audit (CSV)",
        description:
          "Streams persisted audit_log rows as CSV. Each row records one metric comparison between Frostlytics's stored value (frostlytics_value) and the on-chain reference (reference_value) at a pinned Sui checkpoint. Multiple rows per (timestamp, metric) are expected — every backfill run re-audits a rolling 7-day window, so audit passes accumulate as evidence of continued sync over time. Rows older than 32 days are pruned. Use the reference_query column to reproduce any row independently; the query template is documented once at /api/audit/queries.",
      },
      response: {
        200: t.String({
          description:
            "CSV with a header row followed by one data row per metric comparison, ordered by created_at desc then timestamp desc. Columns: created_at, timestamp, checkpoint, metric, frostlytics_value, reference_value, delta, delta_pct, source, reference_query, notes.",
        }),
      },
    }
  )
  .get(
    "/api/audit/json",
    async ({ query }) => {
      const rng = {
        from: query.from ?? defaultWindow().from,
        to: query.to ?? defaultWindow().to,
        metric: query.metric,
      }
      const rows = await db
        .select()
        .from(auditLog)
        .where(buildConditions(rng))
        .orderBy(desc(auditLog.createdAt), desc(auditLog.timestamp), asc(auditLog.metric))
        .limit(parseInt(query.limit || "500000"))
      return rows.map((r) => ({
        createdAt: r.createdAt.toISOString(),
        timestamp: r.timestamp.toISOString(),
        checkpoint: r.checkpoint,
        metric: r.metric,
        frostlyticsValue: r.frostlyticsValue,
        referenceValue: r.referenceValue,
        delta: r.delta,
        deltaPct: r.deltaPct,
        source: r.source,
        referenceQuery: r.referenceQuery,
        notes: r.notes,
        id: r.id,
      }))
    },
    {
      query: t.Object({
        from: t.Optional(
          t.String({
            format: "date",
            description:
              "Start of window (inclusive). ISO 8601 date. Default: 30 days ago.",
          })
        ),
        to: t.Optional(
          t.String({
            format: "date",
            description:
              "End of window (inclusive). ISO 8601 date. Default: now.",
          })
        ),
        metric: t.Optional(
          t.String({
            description:
              "Optional metric filter. Exact match or trailing '*' for prefix (e.g. 'per_operator.*').",
          })
        ),
        limit: t.Optional(
          t.String({
            description: "Max rows returned (default 500000).",
          })
        ),
      }),
      detail: {
        tags: ["Audit"],
        summary: "Reconciliation audit (JSON)",
        description:
          "Same content as /api/audit/csv but returned as JSON for programmatic consumers. See CSV endpoint for semantics.",
      },
      response: {
        200: t.Array(
          t.Object({
            createdAt: t.String({
              format: "date-time",
              description:
                "When this audit row was written. Each rolling-window pass produces a new row per (timestamp, metric), distinguished by createdAt. Response is sorted by createdAt desc.",
            }),
            timestamp: t.String({
              format: "date-time",
              description: "UTC day being audited (start-of-day)",
            }),
            checkpoint: t.Union([t.Number(), t.Null()], {
              description:
                "Sui checkpoint sequence_number the audit pinned. Null for defillama rows (no on-chain checkpoint).",
            }),
            metric: t.String({
              description:
                "Metric name. Network-level (e.g. 'totalStakedWAL') or per-operator ('per_operator.stakedWAL').",
            }),
            frostlyticsValue: t.Union([t.Number(), t.Null()], {
              description: "Value read from the Frostlytics DB for that day.",
            }),
            referenceValue: t.Union([t.Number(), t.Null()], {
              description:
                "Value re-computed from the on-chain (or external) source at the pinned checkpoint.",
            }),
            delta: t.Union([t.Number(), t.Null()], {
              description: "frostlyticsValue - referenceValue.",
            }),
            deltaPct: t.Union([t.Number(), t.Null()], {
              description:
                "Signed percent delta vs reference. Match tolerance is ~0.01%.",
            }),
            source: t.String({
              description:
                "Source key ('sui_graphql:systemInner' | 'sui_graphql:stakingInner' | 'sui_graphql:activeSet' | 'defillama:walrus-protocol'). Full query template documented at /api/audit/queries.",
            }),
            referenceQuery: t.String({
              description:
                "HTTP call (lean form) + jq extract + decode + DB column for this row. Reproduce by looking up the query template in /api/audit/queries and substituting the variables shown here.",
            }),
            notes: t.Union([t.String(), t.Null()], {
              description:
                "Row-specific context. Contains 'operatorId=0x...' for per-operator metrics, empty otherwise.",
            }),
            id: t.String({ format: "uuid" }),
          }),
          {
            description:
              "Ordered by (createdAt desc, timestamp desc, metric asc).",
          }
        ),
      },
    }
  )
  .get(
    "/api/audit/queries",
    ({ set }) => {
      set.headers["content-type"] = "text/plain; charset=utf-8"
      return renderQueriesPlain()
    },
    {
      detail: {
        tags: ["Audit"],
        summary: "Audit reference queries (plain text)",
        description:
          "Plain-text documentation of every on-chain / external query used by the audit. Contains the shared GraphQL template that every audit row references, the jq navigation convention, per-source object IDs, per-metric jq expressions and DB columns, and a commission-is-not-historically-audited caveat.",
      },
      response: {
        200: t.String({ description: "Plain text document." }),
      },
    }
  )
