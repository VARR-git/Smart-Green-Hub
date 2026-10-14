import type { HydroData, Sample } from "./types"

export const DEMO_DATA: HydroData = {
  ph: 6.18,
  tds: 782,
  temperature: 23.4,
  humidity: 68,
  pump: true,
  lamp: true,
  fan: false,
  espStatus: "demo",
  lastPing: null,
  updatedAt: "simulasi",
  fw: { running: "demo" },
}

const DEMO_POINTS = [
  [6.08, 758, 22.8, 66],
  [6.12, 766, 22.9, 67],
  [6.09, 772, 23.1, 67],
  [6.15, 768, 23.2, 68],
  [6.18, 776, 23.3, 68],
  [6.16, 784, 23.4, 69],
  [6.21, 790, 23.5, 69],
  [6.19, 786, 23.4, 68],
  [6.17, 779, 23.3, 68],
  [6.2, 782, 23.4, 68],
] as const

export const buildDemoHistory = (now = Date.now()): Sample[] =>
  DEMO_POINTS.map(([ph, tds, temp, humi], index) => ({
    t: now - (DEMO_POINTS.length - 1 - index) * 5 * 60_000,
    ph,
    tds,
    temp,
    humi,
  }))

const vary = (
  value: number,
  min: number,
  max: number,
  maxStep: number,
  digits: number,
  random: () => number,
) => {
  const direction = random() < 0.5 ? -1 : 1
  const step = Math.max(10 ** -digits, random() * maxStep)
  const candidate = value + direction * step
  const next = candidate < min || candidate > max
    ? value - direction * step
    : candidate
  return Number(Math.min(max, Math.max(min, next)).toFixed(digits))
}

export const nextDemoData = (
  previous: HydroData,
  random: () => number = Math.random,
  now = new Date(),
): HydroData => ({
  ...previous,
  ph: vary(previous.ph ?? DEMO_DATA.ph!, 5.85, 6.45, 0.04, 2, random),
  tds: vary(previous.tds ?? DEMO_DATA.tds!, 720, 830, 8, 0, random),
  temperature: vary(
    previous.temperature ?? DEMO_DATA.temperature!,
    21.8,
    24.8,
    0.1,
    1,
    random,
  ),
  humidity: vary(
    previous.humidity ?? DEMO_DATA.humidity!,
    58,
    76,
    1,
    0,
    random,
  ),
  updatedAt: now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }),
})

export const setDemoActuator = (
  data: HydroData,
  key: "pump" | "lamp" | "fan",
  on: boolean,
): HydroData => ({ ...data, [key]: on })

export const DEMO_HISTORY = buildDemoHistory()
