import type { Sample } from "./types"

export interface Stat {
  min: number
  max: number
  avg: number
  count: number
}

type Key = "ph" | "tds" | "temp" | "humi"

export function summarize(samples: Sample[], key: Key): Stat | null {
  const vals = samples
    .map((s) => s[key])
    .filter((v): v is number => v != null)
  if (!vals.length) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: sum / vals.length,
    count: vals.length,
  }
}

export function todays(samples: Sample[]): Sample[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return samples.filter((s) => s.t >= start.getTime())
}
