export const METRIC_CHART_CLASS =
  "!aspect-auto h-full min-h-0 w-full [&_.recharts-responsive-container]:!h-full"

export const METRIC_CHART_MARGIN = { top: 4, right: 8, left: 0, bottom: 0 }

export const METRIC_AXIS_TICK = { fontSize: 10, fill: "var(--color-tertiary)" }

export const METRIC_GRID_PROPS = {
  vertical: false as const,
  stroke: "var(--color-border-secondary)",
  strokeOpacity: 0.3,
  strokeDasharray: "3 6",
}

export function paddedDomain(
  values: (number | null | undefined)[]
): [number, number] {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  )
  if (!nums.length) return [0, 1]
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.08
    return [Math.max(0, min - pad), max + pad]
  }
  const pad = (max - min) * 0.1
  return [Math.max(0, min - pad), max + pad]
}

export function barYDomain(
  values: (number | null | undefined)[]
): [number, number] {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  )
  if (!nums.length) return [0, 1]
  const max = Math.max(...nums)
  const pad = max * 0.1 || 1
  return [0, max + pad]
}
