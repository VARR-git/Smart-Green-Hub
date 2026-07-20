import { useState } from "react"
import { Droplets, Fan, Lightbulb } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
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
}: {
  data: HydroData | null
  disabled: boolean
}) {
  const [busy, setBusy] = useState<string | null>(null)

  const toggle = async (key: "pump" | "lamp" | "fan", on: boolean) => {
    setBusy(key)
    try {
      await setActuator(key, on)
    } catch {
      /* penulisan ditolak / offline */
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">
        Kontrol Aktuator
      </p>
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const on = !!data?.[key]
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-2 rounded-md border border-border/70 p-3 transition-colors",
                on && "border-primary/30 bg-primary/5",
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  on ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="text-xs font-medium">{label}</span>
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
    </Card>
  )
}
