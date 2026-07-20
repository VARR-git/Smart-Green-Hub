import { Beaker, Droplets, Gauge, Thermometer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhScale } from "@/components/PhScale"
import { SensorCard } from "@/components/SensorCard"
import { ActuatorControls } from "@/components/ActuatorControls"
import { TrendChart } from "@/components/TrendChart"
import { fmtNum, statusOf } from "@/lib/format"
import { summarize, todays } from "@/lib/stats"
import type { HydroData, Sample, Thresholds } from "@/lib/types"

interface Props {
  data: HydroData | null
  history: Sample[]
  connected: boolean
  th: Thresholds
}

export function MonitorTab({ data, history, connected, th }: Props) {
  const ph = data?.ph ?? null
  const phBad = ph != null && (ph < th.phMin || ph > th.phMax)
  const today = todays(history)
  const sPh = summarize(today, "ph")
  const sTds = summarize(today, "tds")

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Hero pH */}
      <Card className="lg:col-span-2">
        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Beaker className="size-4 text-primary" />
              Tingkat Keasaman (pH)
            </div>
            <Badge variant={phBad ? "danger" : "default"}>
              {ph == null ? "menunggu" : phBad ? "perlu tindakan" : "seimbang"}
            </Badge>
          </div>
          <div className="mb-5 flex items-baseline gap-2">
            <span className="nums text-6xl font-semibold tracking-tighter">
              {fmtNum(ph, 2)}
            </span>
            <span className="text-sm text-muted-foreground">pH</span>
          </div>
          <PhScale value={ph} min={th.phMin} max={th.phMax} />
        </CardContent>
      </Card>

      {/* Ringkasan hari ini */}
      <Card>
        <CardContent className="flex h-full flex-col justify-center gap-4 p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Ringkasan Hari Ini
          </p>
          <SummaryRow
            label="pH"
            stat={sPh ? `${sPh.min.toFixed(1)}–${sPh.max.toFixed(1)}` : "—"}
            sub={sPh ? `rata ${sPh.avg.toFixed(2)}` : "belum ada data"}
          />
          <SummaryRow
            label="Nutrisi"
            stat={sTds ? `${Math.round(sTds.min)}–${Math.round(sTds.max)}` : "—"}
            sub={sTds ? `rata ${Math.round(sTds.avg)} ppm` : "belum ada data"}
          />
          <SummaryRow
            label="Sampel"
            stat={`${today.length}`}
            sub="tercatat hari ini"
          />
        </CardContent>
      </Card>

      {/* Sensor grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2">
        <SensorCard
          icon={Droplets}
          label="Nutrisi (TDS)"
          value={fmtNum(data?.tds ?? null)}
          unit="ppm"
          accent="water"
          status={statusOf(data?.tds ?? null, th.tdsMin, th.tdsMax)}
        />
        <SensorCard
          icon={Thermometer}
          label="Suhu"
          value={fmtNum(data?.temperature ?? null, 1)}
          unit="°C"
          status={statusOf(data?.temperature ?? null, th.tempMin, th.tempMax)}
        />
        <SensorCard
          icon={Gauge}
          label="Kelembaban"
          value={fmtNum(data?.humidity ?? null)}
          unit="%"
          accent="water"
          status={statusOf(data?.humidity ?? null, 40, 90)}
        />
      </div>

      <ActuatorControls data={data} disabled={!connected} />

      <div className="lg:col-span-3">
        <TrendChart history={history} />
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  stat,
  sub,
}: {
  label: string
  stat: string
  sub: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <div className="nums text-sm font-semibold">{stat}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  )
}
