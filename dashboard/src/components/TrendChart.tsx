import {
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@/components/ui/card"
import { clockOf } from "@/lib/format"
import type { Sample, Thresholds } from "@/lib/types"

export function TrendChart({ history, th }: { history: Sample[]; th: Thresholds }) {
  const data = history.slice(-120).map((s) => ({
    t: s.t,
    ph: s.ph,
    tds: s.tds,
  }))

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Telemetri larutan
          </p>
          <h3 className="mt-0.5 text-sm font-semibold">Stabilitas pH &amp; nutrisi</h3>
        </div>
        <div className="flex gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1 text-primary">
            <span className="size-2 rounded-full bg-primary" /> pH
          </span>
          <span className="flex items-center gap-1 text-water">
            <span className="size-2 rounded-full bg-water" /> TDS
          </span>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="flex h-[200px] items-center justify-center text-center text-xs text-muted-foreground">
          Mengumpulkan data… grafik muncul setelah beberapa pembacaan.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <XAxis
              dataKey="t"
              tickFormatter={clockOf}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              yAxisId="ph"
              domain={[0, 14]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <YAxis yAxisId="tds" hide domain={["auto", "auto"]} />
            <ReferenceArea
              yAxisId="ph"
              y1={th.phMin}
              y2={th.phMax}
              fill="hsl(var(--primary))"
              fillOpacity={0.08}
              strokeOpacity={0}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(t) => clockOf(Number(t))}
              formatter={(v, name) =>
                name === "ph"
                  ? [Number(v).toFixed(2), "pH"]
                  : [Math.round(Number(v)), "TDS ppm"]
              }
            />
            <Line
              yAxisId="ph"
              type="monotone"
              dataKey="ph"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="tds"
              type="monotone"
              dataKey="tds"
              stroke="hsl(var(--water))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
