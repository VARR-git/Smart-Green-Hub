import { useEffect, useState } from "react"
import { Check, RotateCcw, Sprout } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_THRESHOLDS, PLANT_PROFILES } from "@/lib/plants"
import type { Thresholds } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  th: Thresholds
  onSave: (t: Thresholds) => void
}

export function SettingTab({ th, onSave }: Props) {
  const [draft, setDraft] = useState<Thresholds>(th)
  useEffect(() => setDraft(th), [th])

  const dirty = JSON.stringify(draft) !== JSON.stringify(th)
  const set = (patch: Partial<Thresholds>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const activeProfile = PLANT_PROFILES.find(
    (p) =>
      p.phMin === draft.phMin &&
      p.phMax === draft.phMax &&
      p.tdsMin === draft.tdsMin &&
      p.tdsMax === draft.tdsMax,
  )?.name

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      {/* Profil tanaman */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sprout className="size-4 text-primary" />
            <p className="text-sm font-medium">Profil Tanaman</p>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Pilih preset untuk mengisi ambang secara otomatis.
          </p>
          <div className="flex flex-wrap gap-2">
            {PLANT_PROFILES.map((p) => (
              <button
                key={p.name}
                onClick={() =>
                  set({
                    phMin: p.phMin,
                    phMax: p.phMax,
                    tdsMin: p.tdsMin,
                    tdsMax: p.tdsMax,
                    tempMin: p.tempMin,
                    tempMax: p.tempMax,
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeProfile === p.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ambang */}
      <Card>
        <CardContent className="grid gap-7 p-5">
          <RangeRow
            label="Ambang pH"
            unit=""
            min={0}
            max={14}
            step={0.1}
            digits={1}
            value={[draft.phMin, draft.phMax]}
            onChange={([lo, hi]) => set({ phMin: lo, phMax: hi })}
          />
          <RangeRow
            label="Ambang Nutrisi (TDS)"
            unit="ppm"
            min={0}
            max={3000}
            step={10}
            digits={0}
            value={[draft.tdsMin, draft.tdsMax]}
            onChange={([lo, hi]) => set({ tdsMin: lo, tdsMax: hi })}
          />
          <RangeRow
            label="Ambang Suhu"
            unit="°C"
            min={0}
            max={45}
            step={0.5}
            digits={1}
            value={[draft.tempMin, draft.tempMax]}
            onChange={([lo, hi]) => set({ tempMin: lo, tempMax: hi })}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setDraft(DEFAULT_THRESHOLDS)}
        >
          <RotateCcw className="size-3.5" /> Reset default
        </Button>
        <div className="flex items-center gap-3">
          {dirty && <Badge variant="warning">belum disimpan</Badge>}
          <Button size="sm" disabled={!dirty} onClick={() => onSave(draft)}>
            <Check /> Simpan
          </Button>
        </div>
      </div>
    </div>
  )
}

function RangeRow({
  label,
  unit,
  min,
  max,
  step,
  digits,
  value,
  onChange,
}: {
  label: string
  unit: string
  min: number
  max: number
  step: number
  digits: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="nums text-sm text-muted-foreground">
          {value[0].toFixed(digits)} – {value[1].toFixed(digits)} {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange([v[0], v[1]] as [number, number])}
        minStepsBetweenThumbs={1}
      />
    </div>
  )
}
