import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Status } from "@/lib/format"

const DOT: Record<Status, string> = {
  ok: "bg-primary",
  low: "bg-warn",
  high: "bg-warn",
  none: "bg-muted-foreground/40",
}
const LABEL: Record<Status, string> = {
  ok: "Normal",
  low: "Rendah",
  high: "Tinggi",
  none: "—",
}

interface Props {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  hint?: string
  status?: Status
  accent?: "primary" | "water"
}

export function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  status = "none",
  accent = "primary",
}: Props) {
  return (
    <div className="min-w-0 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <Icon
            className={cn(
              "size-4",
              accent === "water" ? "text-water" : "text-primary",
            )}
          />
          <span className="truncate">{label}</span>
        </span>
        <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", DOT[status])} />
          {LABEL[status]}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="nums text-3xl font-semibold tracking-[-0.06em]">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-2 text-[10px] text-muted-foreground">Target {hint}</p>
      )}
    </div>
  )
}
