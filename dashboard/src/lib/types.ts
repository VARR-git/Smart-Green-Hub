export interface Fw {
  running?: string
  version?: string
  status?: string
}

export interface HydroData {
  ph: number | null
  tds: number | null
  temperature: number | null
  humidity: number | null
  pump: boolean
  lamp: boolean
  fan: boolean
  espStatus: string
  lastPing: number | null
  updatedAt: string
  fw: Fw
}

export interface Thresholds {
  phMin: number
  phMax: number
  tdsMin: number
  tdsMax: number
  tempMin: number
  tempMax: number
}

export interface Sample {
  t: number
  ph: number | null
  tds: number | null
  temp: number | null
  humi: number | null
}

export type AlertKind = "ph" | "tds" | "temp" | "offline"

export interface AlertItem {
  t: number
  kind: AlertKind
  level: "warning" | "danger"
  title: string
  detail: string
}

export interface PlantProfile {
  name: string
  phMin: number
  phMax: number
  tdsMin: number
  tdsMax: number
  tempMin: number
  tempMax: number
}
