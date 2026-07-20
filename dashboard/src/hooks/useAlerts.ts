import { useEffect, useRef } from "react"
import { useLocalStorage } from "./useLocalStorage"
import type { AlertItem, HydroData, Thresholds } from "@/lib/types"

export function computeActive(
  data: HydroData | null,
  th: Thresholds,
  connected: boolean,
): AlertItem[] {
  const out: AlertItem[] = []
  const now = Date.now()

  if (!connected) {
    out.push({
      t: now,
      kind: "offline",
      level: "danger",
      title: "Perangkat offline",
      detail: "ESP32 berhenti mengirim data.",
    })
    return out
  }
  if (!data) return out

  if (data.ph != null && (data.ph < th.phMin || data.ph > th.phMax)) {
    out.push({
      t: now,
      kind: "ph",
      level: "danger",
      title: "pH di luar ambang",
      detail: `pH ${data.ph.toFixed(2)} — aman ${th.phMin}–${th.phMax}`,
    })
  }
  if (data.tds != null && data.tds < th.tdsMin) {
    out.push({
      t: now,
      kind: "tds",
      level: "warning",
      title: "Nutrisi rendah",
      detail: `TDS ${Math.round(data.tds)} ppm — minimal ${th.tdsMin}`,
    })
  }
  if (data.tds != null && data.tds > th.tdsMax) {
    out.push({
      t: now,
      kind: "tds",
      level: "warning",
      title: "Nutrisi terlalu pekat",
      detail: `TDS ${Math.round(data.tds)} ppm — maksimal ${th.tdsMax}`,
    })
  }
  if (
    data.temperature != null &&
    (data.temperature < th.tempMin || data.temperature > th.tempMax)
  ) {
    out.push({
      t: now,
      kind: "temp",
      level: "warning",
      title: "Suhu di luar ambang",
      detail: `${data.temperature.toFixed(1)}°C — aman ${th.tempMin}–${th.tempMax}`,
    })
  }
  return out
}

export function useAlertLog(active: AlertItem[]) {
  const [log, setLog] = useLocalStorage<AlertItem[]>("sgh_alertlog", [])
  const seen = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fresh = active.filter((a) => !seen.current.has(a.kind + a.title))
    if (fresh.length) setLog((prev) => [...fresh, ...prev].slice(0, 100))
    seen.current = new Set(active.map((a) => a.kind + a.title))
  }, [active, setLog])

  const clear = () => setLog([])
  return { log, clear }
}
