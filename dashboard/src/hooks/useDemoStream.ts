import { useEffect, useState } from "react"
import {
  DEMO_DATA,
  DEMO_HISTORY,
  nextDemoData,
  setDemoActuator,
} from "@/lib/demo"
import type { Sample } from "@/lib/types"

export function useDemoStream(enabled: boolean) {
  const [stream, setStream] = useState(() => ({
    data: DEMO_DATA,
    history: DEMO_HISTORY,
  }))

  useEffect(() => {
    if (!enabled) return

    const interval = window.setInterval(() => {
      setStream((previous) => {
        const data = nextDemoData(previous.data)
        const sample: Sample = {
          t: Date.now(),
          ph: data.ph,
          tds: data.tds,
          temp: data.temperature,
          humi: data.humidity,
        }
        return {
          data,
          history: [...previous.history, sample].slice(-60),
        }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [enabled])

  const toggleActuator = (key: "pump" | "lamp" | "fan", on: boolean) =>
    setStream((previous) => ({
      ...previous,
      data: setDemoActuator(previous.data, key, on),
    }))

  return { ...stream, toggleActuator }
}
