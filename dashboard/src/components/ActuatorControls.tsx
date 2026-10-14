import { useState } from "react"
import { Droplets, Fan, Lightbulb } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { setActuator } from "@/lib/firebase"
import type { HydroData } from "@/lib/types"
import { cn } from "@/lib/utils"

const ITEMS: { key: "pump" | "lamp" | "fan"; label: string; icon: LucideIcon }[] =
  [
    { key: "pump", label: "Pompa", icon: Droplets },
    { key: "lamp", label: "Lampu", icon: Lightbulb },
    { key: "fan", label: "Kipas", icon: Fan },
  ]

export function ActuatorControls({
  data,
  disabled,
  onToggle,
}: {
  data: HydroData | null
  disabled: boolean
  onToggle?: (key: "pump" | "lamp" | "fan", on: boolean) => void | Promise<void>
}) {
  const [busy, setBusy] = useState<string | null>(null)

  const toggle = async (key: "pump" | "lamp" | "fan", on: boolean) => {
    setBusy(key)
    try {
      await (onToggle ? onToggle(key, on) : setActuator(key, on))
    } catch {
      /* penulisan ditolak / offline */
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Perangkat lapangan
        </p>
        <h3 className="mt-0.5 text-sm font-semibold">
          {onToggle ? "Kendali simulasi" : "Kendali manual"}
        </h3>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const on = !!data?.[key]
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-2 p-3.5 transition-colors",
                on && "bg-secondary",
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  on ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="text-xs font-medium">{label}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {on ? "Aktif" : "Siaga"}
              </span>
              <Switch
                checked={on}
                disabled={disabled || busy === key}
                onCheckedChange={(v) => toggle(key, v)}
                aria-label={label}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
