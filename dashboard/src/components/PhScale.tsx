import { cn } from "@/lib/utils"

// Skala reagen pH 0–14 — elemen tanda khas dashboard ini.
const STOPS =
  "#c0453a, #cf7238 14%, #d6a93f 28%, #9cbf54 42%, #57ab5b 50%, #3aa79c 64%, #3f76c4 82%, #6a56b8"

interface Props {
  value: number | null
  min: number
  max: number
}

export function PhScale({ value, min, max }: Props) {
  const pct = (v: number) => Math.max(0, Math.min(100, (v / 14) * 100))
  const has = value != null

  return (
    <div className="w-full">
      <div className="relative h-3 w-full rounded-full">
        <div
          className="absolute inset-0 rounded-full opacity-90"
          style={{ background: `linear-gradient(90deg, ${STOPS})` }}
        />
        {/* pita aman */}
        <div
          className="absolute inset-y-0 rounded-full ring-2 ring-foreground/70 ring-offset-0"
          style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }}
        />
        {/* penanda nilai */}
        {has && (
          <div
            className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground shadow-md transition-[left] duration-500"
            style={{ left: `${pct(value!)}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
        <span>0 asam</span>
        <span
          className={cn(
            "tabular-nums",
            has && (value! < min || value! > max)
              ? "text-destructive"
              : "text-primary",
          )}
        >
          aman {min}–{max}
        </span>
        <span>14 basa</span>
      </div>
    </div>
  )
}
