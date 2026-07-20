import type { PlantProfile, Thresholds } from "./types"

export const PLANT_PROFILES: PlantProfile[] = [
  { name: "Selada", phMin: 5.5, phMax: 6.5, tdsMin: 560, tdsMax: 840, tempMin: 18, tempMax: 24 },
  { name: "Pakcoy", phMin: 6.0, phMax: 7.0, tdsMin: 700, tdsMax: 1050, tempMin: 18, tempMax: 26 },
  { name: "Bayam", phMin: 6.0, phMax: 7.0, tdsMin: 1120, tdsMax: 1610, tempMin: 18, tempMax: 26 },
  { name: "Tomat", phMin: 5.5, phMax: 6.5, tdsMin: 1400, tdsMax: 2100, tempMin: 20, tempMax: 28 },
  { name: "Cabai", phMin: 5.5, phMax: 6.8, tdsMin: 1400, tdsMax: 1750, tempMin: 20, tempMax: 30 },
]

export const DEFAULT_THRESHOLDS: Thresholds = {
  phMin: 5.5,
  phMax: 6.5,
  tdsMin: 560,
  tdsMax: 840,
  tempMin: 18,
  tempMax: 24,
}
