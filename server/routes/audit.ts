import { and, asc, gte, like, lte, SQL } from "drizzle-orm"
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

const renderQueriesMarkdown = (): string => {
  const lines: string[] = []
  lines.push("# Frostlytics Audit — Reference Queries")
  lines.push("")
  lines.push(
    "Each row in `/api/audit.csv` lists the HTTP call, the jq extraction, the decoding rule, and the DB column that row compares. The HTTP call in each row is written as `SuiGraphQL <queryName> <var>=<val>` — the full query body is fixed and documented once here, so rows stay compact."
  )
  lines.push("")
  lines.push(
    "For Sui GraphQL sources, the audit pins each row to the checkpoint recorded in `aggregated_daily.sequence_number` for that day. The `beforeCheckpoint` parameter in the query is `checkpoint + 1` so the returned object reflects the state *at* that checkpoint."
  )
  lines.push("")

  lines.push("## Query template")
  lines.push("")
  lines.push(
    `Every \`SuiGraphQL ${SUI_OBJECT_QUERY_NAME} ...\` row resolves to a POST against \`${SUI_GRAPHQL_ENDPOINT}\` with this body:`
  )
  lines.push("")
  lines.push("```graphql")
  lines.push(SUI_OBJECT_QUERY_BODY)
  lines.push("```")
  lines.push("")
  lines.push(
    "Substitute the row's `objectId` and `beforeCheckpoint` values into the `$variables`. To reproduce from curl:"
  )
  lines.push("")
  lines.push("```bash")
  lines.push(`curl -s ${SUI_GRAPHQL_ENDPOINT} -H 'Content-Type: application/json' \\`)
  lines.push(
    `  -d '{"query":"${SUI_OBJECT_QUERY_NAME}($beforeCheckpoint: Int, $objectId: String) { ... }","variables":{"objectId":"<OBJ>","beforeCheckpoint":<N+1>}}'`
  )
  lines.push("```")
  lines.push("")

  lines.push("## Sources")
  lines.push("")
  for (const src of Object.values(AUDIT_SOURCES)) {
    lines.push(`### ${src.source}`)
    lines.push("")
    if (src.objectId) lines.push(`- **Object ID**: \`${src.objectId}\``)
    lines.push(`- **Description**: ${src.description}`)
    lines.push("")
  }

  lines.push("## Metrics")
  lines.push("")
  for (const [metric, def] of Object.entries(METRIC_DEFS)) {
    lines.push(`### \`${metric}\``)
    lines.push("")
    lines.push(`- **Source**: \`${def.source}\``)
    lines.push(`- **Frostlytics side**: \`${def.dbColumn}\``)
    lines.push(`- **Extract path**: \`${def.extractPath}\``)
    lines.push(`- **Decoding**: ${def.decoding}`)
    lines.push("")
    lines.push(
      "Example `reference_query` cell (checkpoint `<N>`, date `<YYYY-MM-DD>`" +
        (def.perOperator ? ", operator `<0x...>`" : "") +
        "):"
    )
    lines.push("")
    lines.push("```")
    lines.push(
      buildReferenceQuery({
        metric,
        checkpoint: 0,
        date: "<YYYY-MM-DD>",
        operatorId: def.perOperator ? "<0x...>" : undefined,
      }).replace(/"beforeCheckpoint":\s*1/, '"beforeCheckpoint": <N + 1>')
    )
    lines.push("```")
    lines.push("")
  }

  lines.push("## Commission (not historically audited)")
  lines.push("")
  lines.push(
    "Commission rate is read per pool at the current checkpoint only — historical commission per operator per day is not stored in `operator_daily` today, so it is outside the scope of this audit. For a current-state spot check, call `sui_multiGetObjects` with the pool object ID and inspect `content.fields.commission_rate` (divide by 10,000 to get the decimal rate)."
  )
  lines.push("")
  return lines.join("\n")
}

export const auditRoutes = new Elysia({ tags: ["Audit"] })
  .get(
    "/api/audit.csv",
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
        .orderBy(asc(auditLog.timestamp), asc(auditLog.metric), asc(auditLog.createdAt))
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
        summary: "Reconciliation audit (CSV)",
        description:
          "Streams persisted audit_log rows as CSV. Each row records one metric comparison between Frostlytics's stored value (frostlytics_value) and the on-chain reference (reference_value) at a pinned Sui checkpoint. Multiple rows per (timestamp, metric) are expected — every backfill run re-audits the rolling 21-day window, so audit passes accumulate as evidence of continued sync over time. Use the reference_query column to reproduce any row independently.",
      },
    }
  )
  .get(
    "/api/audit.json",
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
        .orderBy(asc(auditLog.timestamp), asc(auditLog.metric), asc(auditLog.createdAt))
        .limit(parseInt(query.limit || "500000"))
      return rows.map((r) => ({
        id: r.id,
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
        createdAt: r.createdAt.toISOString(),
      }))
    },
    {
      query: t.Object({
        from: t.Optional(t.String({ format: "date" })),
        to: t.Optional(t.String({ format: "date" })),
        metric: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Reconciliation audit (JSON)",
        description:
          "Same content as /api/audit.csv but returned as JSON for programmatic consumers.",
      },
    }
  )
  .get(
    "/api/audit/queries.md",
    ({ set }) => {
      set.headers["content-type"] = "text/markdown; charset=utf-8"
      return renderQueriesMarkdown()
    },
    {
      detail: {
        summary: "Audit reference queries (Markdown)",
        description:
          "Human-readable documentation of every on-chain / external query used by the audit. Includes object IDs, decoding rules, and a commission-is-not-historically-audited caveat.",
      },
    }
  )
