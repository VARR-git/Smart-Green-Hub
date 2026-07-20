import { useEffect, useRef, useState } from "react"
import { signIn, subscribe } from "@/lib/firebase"
import type { HydroData, Sample } from "@/lib/types"

const HIST_KEY = "sgh_history"
const HIST_CAP = 1000
const SAMPLE_EVERY = 4000
const STALE_MS = 15000

function loadHistory(): Sample[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || "[]") as Sample[]
  } catch {
    return []
  }
}

export function useHydroData() {
  const [data, setData] = useState<HydroData | null>(null)
  const [history, setHistory] = useState<Sample[]>(loadHistory)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastRecv = useRef(0)
  const lastSample = useRef(0)

  useEffect(() => {
    let unsub = () => {}
    signIn()
      .then(() => {
        unsub = subscribe((d) => {
          setData(d)
          lastRecv.current = Date.now()
          setConnected(true)
          if (d.ph != null && Date.now() - lastSample.current > SAMPLE_EVERY) {
            lastSample.current = Date.now()
            setHistory((prev) => {
              const next = [
                ...prev,
                { t: Date.now(), ph: d.ph, tds: d.tds, temp: d.temperature, humi: d.humidity },
              ].slice(-HIST_CAP)
              try {
                localStorage.setItem(HIST_KEY, JSON.stringify(next))
              } catch {
                /* abaikan */
              }
              return next
            })
          }
        })
      })
      .catch((e) => setError(e?.message ?? "Gagal masuk ke Firebase"))

    const iv = setInterval(
      () => setConnected(Date.now() - lastRecv.current < STALE_MS),
      3000,
    )
    return () => {
      unsub()
      clearInterval(iv)
    }
  }, [])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(HIST_KEY)
  }

  return { data, history, connected, error, clearHistory }
}
