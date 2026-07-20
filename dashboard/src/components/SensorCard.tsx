import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
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
  status?: Status
  accent?: "primary" | "water"
}

export function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  status = "none",
  accent = "primary",
}: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon
            className={cn(
              "size-4",
              accent === "water" ? "text-water" : "text-primary",
            )}
          />
          {label}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", DOT[status])} />
          {LABEL[status]}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="nums text-3xl font-semibold tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </Card>
  )
}
