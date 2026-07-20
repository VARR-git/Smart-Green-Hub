export type Status = "ok" | "low" | "high" | "none"

export function statusOf(
  v: number | null,
  min: number,
  max: number,
): Status {
  if (v == null) return "none"
  if (v < min) return "low"
  if (v > max) return "high"
  return "ok"
}

export const fmtNum = (v: number | null, digits = 0) =>
  v == null ? "—" : v.toFixed(digits)

export function timeAgo(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000)
  if (s < 60) return `${s} dtk lalu`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} mnt lalu`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.round(h / 24)} hr lalu`
}

export const clockOf = (ms: number) =>
  new Date(ms).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
