import "dotenv/config"

import _ from "lodash"

import { computeDailyMetrics } from "../server/services/backfill-compute"
import { dayjs } from "../src/lib/dayjs"

const API_URL =
  process.env.AUDIT_API_URL ?? "https://api.frostlytics.xyz/api/historical-data"

const DAYS = 21
const MATCH_TOLERANCE_PCT = 0.01
const DRIFT_WARN_PCT = 1

const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
}

const CLEAR_LINE = "\x1b[K"

type ApiRow = {
  timestamp: string
  sequenceNumber: number
  paidFeesUSD: number | null
  totalStakedWAL: number | null
  storageUsedTB: number | null
}

const padLeft = (s: string, width: number) =>
  s.length >= width ? s : " ".repeat(width - s.length) + s
const padRight = (s: string, width: number) =>
  s.length >= width ? s : s + " ".repeat(width - s.length)

const fmtNum = (n: number | null | undefined, digits = 2) => {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}
const fmtInt = (n: number | null | undefined) => {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-US").format(n)
}

const renderCkpt = (ckpt: number | null): string => {
  if (ckpt == null) return c.dim("—")
  return c.dim(fmtInt(ckpt))
}

type DiffResult =
  | { kind: "match" }
  | { kind: "drift"; pct: number; signed: number }
  | { kind: "null-api" }
  | { kind: "null-truth" }

const diffField = (
  apiVal: number | null | undefined,
  truthVal: number | null | undefined
): DiffResult => {
  if (apiVal == null && truthVal == null) return { kind: "match" }
  if (apiVal == null) return { kind: "null-api" }
  if (truthVal == null) return { kind: "null-truth" }
  if (truthVal === 0 && apiVal === 0) return { kind: "match" }
  const denom = Math.abs(truthVal) || Math.abs(apiVal) || 1
  const signed = ((apiVal - truthVal) / denom) * 100
  const pct = Math.abs(signed)
  if (pct <= MATCH_TOLERANCE_PCT) return { kind: "match" }
  return { kind: "drift", pct, signed }
}

const renderDiff = (d: DiffResult): string => {
  if (d.kind === "match") return c.green(padLeft("✓", 8))
  if (d.kind === "null-api") return c.red(padLeft("null:api", 8))
  if (d.kind === "null-truth") return c.red(padLeft("null:src", 8))
  const sign = d.signed >= 0 ? "+" : "−"
  const pctStr = `${sign}${d.pct.toFixed(d.pct < 10 ? 2 : 1)}%`
  const colorFn = d.pct >= DRIFT_WARN_PCT ? c.red : c.yellow
  return colorFn(padLeft(pctStr, 8))
}

const rowHasDrift = (diffs: DiffResult[]) =>
  diffs.some((d) => d.kind !== "match")

const fetchApi = async (): Promise<ApiRow[]> => {
  const res = await fetch(API_URL, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`API returned ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as ApiRow[]
}

const utcDayKey = (iso: string) => iso.slice(0, 10)

async function main() {
  console.log("")
  console.log(c.bold("  Frostlytics Historical Data Audit"))
  console.log(c.dim(`  API: ${API_URL}`))
  console.log(c.dim(`  Comparing last ${DAYS} days against on-chain source`))
  console.log("")

  process.stdout.write(c.dim("  Fetching API...\r"))
  const apiRows = await fetchApi()
  process.stdout.write(CLEAR_LINE)

  const apiByDay = new Map<string, ApiRow>()
  for (const row of apiRows) {
    apiByDay.set(utcDayKey(row.timestamp), row)
  }

  const dates = _.range(DAYS).map((i) =>
    dayjs
      .utc()
      .subtract(i + 1, "day")
      .startOf("day")
  )

  const W = { date: 10, diff: 8, wal: 16, tb: 12, status: 14 }
  const header =
    "  " +
    [
      padRight("DATE", W.date),
      padLeft("STAKED WAL", W.wal),
      padLeft("Δ", W.diff),
      padLeft("STORAGE TB", W.tb),
      padLeft("Δ", W.diff),
      "  " + padRight("STATUS", W.status),
      "  " + "CKPT",
    ].join("  ")
  console.log(c.bold(header))
  console.log(c.dim("  " + "─".repeat(header.length - 2)))

  let matchCount = 0
  let driftCount = 0
  let missingCount = 0
  let errorCount = 0

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    const dayKey = date.format("YYYY-MM-DD")

    process.stdout.write(
      `\r${CLEAR_LINE}  ${c.dim(`[${i + 1}/${DAYS}]`)} ${dayKey} ${c.dim("computing from source...")}`
    )

    const apiRow = apiByDay.get(dayKey)
    const ckpt = apiRow?.sequenceNumber ?? null

    let status: string
    let stakedDiff: DiffResult = { kind: "match" }
    let storageDiff: DiffResult = { kind: "match" }

    if (!apiRow) {
      missingCount++
      status = c.red("MISSING")
    } else {
      try {
        const metrics = await computeDailyMetrics(date, undefined, {
          checkpoint: apiRow.sequenceNumber,
        })
        if (!metrics) {
          errorCount++
          status = c.red("SOURCE_ERROR")
        } else {
          stakedDiff = diffField(apiRow.totalStakedWAL, metrics.totalStakedWAL)
          storageDiff = diffField(apiRow.storageUsedTB, metrics.storageUsageTB)
          if (rowHasDrift([stakedDiff, storageDiff])) {
            driftCount++
            status = c.yellow("DRIFT")
          } else {
            matchCount++
            status = c.green("MATCH")
          }
        }
      } catch (err) {
        errorCount++
        status = c.red("SOURCE_ERROR")
      }
    }

    const apiStakedStr = apiRow ? fmtNum(apiRow.totalStakedWAL) : "—"
    const apiStorageStr = apiRow ? fmtNum(apiRow.storageUsedTB) : "—"

    const row =
      "  " +
      [
        padRight(dayKey, W.date),
        padLeft(apiStakedStr, W.wal),
        renderDiff(stakedDiff),
        padLeft(apiStorageStr, W.tb),
        renderDiff(storageDiff),
        "  " + padRight(status, W.status),
        "  " + renderCkpt(ckpt),
      ].join("  ")

    process.stdout.write(`\r${CLEAR_LINE}${row}\n`)
  }

  process.stdout.write(`\r${CLEAR_LINE}`)
  console.log(c.dim("  " + "─".repeat(header.length - 2)))
  const parts = [
    c.green(`${matchCount} match`),
    c.yellow(`${driftCount} drift`),
    c.red(`${missingCount} missing`),
    c.red(`${errorCount} error`),
  ]
  console.log("  " + c.bold("Summary: ") + parts.join(c.dim(" · ")))
  console.log("")

  const exitCode = driftCount + missingCount + errorCount > 0 ? 1 : 0
  process.exit(exitCode)
}

main().catch((err) => {
  console.error(c.red("\nAudit failed:"), err)
  process.exit(2)
})
