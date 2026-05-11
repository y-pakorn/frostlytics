// Pct change between the latest value and the value N positions earlier.
// Returns null if either endpoint is missing or the baseline is zero.
export const deltaOver = (
  series: (number | null)[],
  windowSize: number
): number | null => {
  if (series.length < 2) return null
  const latest = series[series.length - 1]
  if (latest == null) return null
  const baselineIdx = Math.max(0, series.length - 1 - windowSize)
  const baseline = series[baselineIdx]
  if (baseline == null || baseline === 0) return null
  return (latest - baseline) / baseline
}

export const stddev = (values: number[]) => {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export const pearson = (xs: number[], ys: number[]) => {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx2 = 0
  let dy2 = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    num += dx * dy
    dx2 += dx * dx
    dy2 += dy * dy
  }
  const den = Math.sqrt(dx2 * dy2)
  return den === 0 ? 0 : num / den
}

// Simple linear-regression projection: returns days until y(t) reaches `target`,
// or null if the trend is flat / declining.
export const projectDaysUntil = (
  series: { t: number; y: number }[],
  target: number
) => {
  const n = series.length
  if (n < 2) return null
  const meanT = series.reduce((a, b) => a + b.t, 0) / n
  const meanY = series.reduce((a, b) => a + b.y, 0) / n
  let num = 0
  let den = 0
  for (const p of series) {
    num += (p.t - meanT) * (p.y - meanY)
    den += (p.t - meanT) ** 2
  }
  if (den === 0) return null
  const slope = num / den // y per ms
  const intercept = meanY - slope * meanT
  if (slope <= 0) return null
  const latestY = series[series.length - 1].y
  if (latestY >= target) return 0
  const targetMs = (target - intercept) / slope
  const nowMs = series[series.length - 1].t
  return Math.max(0, Math.round((targetMs - nowMs) / 86_400_000))
}
