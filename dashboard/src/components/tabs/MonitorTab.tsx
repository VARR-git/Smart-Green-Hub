import {
  Activity,
  Beaker,
  Droplets,
  Gauge,
  Sprout,
  Thermometer,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PhScale } from "@/components/PhScale"
import { SensorCard } from "@/components/SensorCard"
import { ActuatorControls } from "@/components/ActuatorControls"
import { TrendChart } from "@/components/TrendChart"
import { fmtNum, statusOf } from "@/lib/format"
import { PLANT_PROFILES } from "@/lib/plants"
import { summarize, todays } from "@/lib/stats"
import type { HydroData, Sample, Thresholds } from "@/lib/types"

interface Props {
  data: HydroData | null
  history: Sample[]
  connected: boolean
  demo: boolean
  onDemoActuator: (key: "pump" | "lamp" | "fan", on: boolean) => void
  th: Thresholds
}

export function MonitorTab({
  data,
  history,
  connected,
  demo,
  onDemoActuator,
  th,
}: Props) {
  const ph = data?.ph ?? null
  const phStatus = statusOf(ph, th.phMin, th.phMax)
  const tdsStatus = statusOf(data?.tds ?? null, th.tdsMin, th.tdsMax)
  const tempStatus = statusOf(data?.temperature ?? null, th.tempMin, th.tempMax)
  const humidityStatus = statusOf(data?.humidity ?? null, 40, 90)
  const statuses = [phStatus, tdsStatus, tempStatus, humidityStatus]
  const measured = statuses.filter((status) => status !== "none")
  const healthy = measured.filter((status) => status === "ok").length
  const issues = measured.length - healthy
  const today = todays(history)
  const sPh = summarize(today, "ph")
  const sTds = summarize(today, "tds")
  const profile = PLANT_PROFILES.find(
    (item) =>
      item.phMin === th.phMin &&
      item.phMax === th.phMax &&
      item.tdsMin === th.tdsMin &&
      item.tdsMax === th.tdsMax &&
      item.tempMin === th.tempMin &&
      item.tempMax === th.tempMax,
  )?.name

  const headline = demo
    ? "Simulasi kondisi tumbuh"
    : !connected
    ? "Node lapangan tidak merespons"
    : measured.length === 0
      ? "Menunggu pembacaan sensor"
      : issues > 0
        ? `${issues} parameter perlu diperiksa`
        : "Kondisi tumbuh dalam rentang aman"

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Activity className="size-3.5" />
            {demo ? "Mode simulasi" : "Pantauan langsung"}
          </div>
          <h2 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
            {headline}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Instalasi utama · {profile ? `profil ${profile}` : "ambang kustom"}
            {demo && " · bukan pembacaan perangkat"}
          </p>
        </div>
        <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
          <span className="nums text-2xl font-bold tracking-tight">
            {healthy}/{measured.length || 4}
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            parameter<br />terkendali
          </span>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
        <section className="overflow-hidden rounded-lg bg-forest text-forest-foreground">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <Beaker className="size-4 text-field" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-forest-foreground/55">
                  Reservoir A
                </p>
                <h3 className="text-sm font-semibold">Kualitas larutan</h3>
              </div>
            </div>
            <Badge
              variant={phStatus === "ok" && tdsStatus === "ok" ? "default" : "warning"}
              className="rounded-sm border-0 bg-field text-forest hover:bg-field"
            >
              {phStatus === "none" || tdsStatus === "none"
                ? "menunggu data"
                : phStatus === "ok" && tdsStatus === "ok"
                  ? "larutan stabil"
                  : "cek larutan"}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2">
            <div className="px-5 py-6 sm:border-r sm:border-white/10 sm:px-6 sm:py-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-foreground/50">
                Derajat keasaman
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="nums text-6xl font-semibold leading-none tracking-[-0.07em] sm:text-7xl">
                  {fmtNum(ph, 2)}
                </span>
                <span className="mb-1 text-sm text-forest-foreground/55">pH</span>
              </div>
              <p className="mt-3 text-xs text-forest-foreground/55">
                Target {th.phMin.toFixed(1)}—{th.phMax.toFixed(1)}
              </p>
            </div>

            <div className="border-t border-white/10 px-5 py-6 sm:border-t-0 sm:px-6 sm:py-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-foreground/50">
                Kepekatan nutrisi
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="nums text-6xl font-semibold leading-none tracking-[-0.07em] sm:text-7xl">
                  {fmtNum(data?.tds ?? null)}
                </span>
                <span className="mb-1 text-sm text-forest-foreground/55">ppm</span>
              </div>
              <p className="mt-3 text-xs text-forest-foreground/55">
                Target {th.tdsMin}—{th.tdsMax} ppm
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-5 sm:px-6">
            <PhScale value={ph} min={th.phMin} max={th.phMax} inverse />
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Zona tanam
                </p>
                <h3 className="mt-0.5 text-sm font-semibold">Iklim mikro</h3>
              </div>
              <Sprout className="size-4 text-primary" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <SensorCard
                icon={Thermometer}
                label="Suhu"
                value={fmtNum(data?.temperature ?? null, 1)}
                unit="°C"
                hint={`${th.tempMin}—${th.tempMax}°`}
                status={tempStatus}
              />
              <SensorCard
                icon={Gauge}
                label="Kelembaban"
                value={fmtNum(data?.humidity ?? null)}
                unit="%"
                hint="40—90%"
                accent="water"
                status={humidityStatus}
              />
            </div>
          </section>

          <ActuatorControls
            data={data}
            disabled={!connected && !demo}
            onToggle={demo ? onDemoActuator : undefined}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.6fr)]">
        <TrendChart history={history} th={th} />

        <section className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Rekam hari ini
              </p>
              <h3 className="mt-0.5 text-sm font-semibold">Rentang pembacaan</h3>
            </div>
            <Droplets className="size-4 text-water" />
          </div>
          <dl className="divide-y divide-border">
            <SummaryRow
              label="pH"
              stat={sPh ? `${sPh.min.toFixed(1)}—${sPh.max.toFixed(1)}` : "—"}
              sub={sPh ? `rata ${sPh.avg.toFixed(2)}` : "belum ada data"}
            />
            <SummaryRow
              label="Nutrisi"
              stat={sTds ? `${Math.round(sTds.min)}—${Math.round(sTds.max)}` : "—"}
              sub={sTds ? `rata ${Math.round(sTds.avg)} ppm` : "belum ada data"}
            />
            <SummaryRow
              label="Sampel"
              stat={`${today.length}`}
              sub="tercatat hari ini"
            />
          </dl>
        </section>
      </div>
    </div>
  )
}

function SummaryRow({ label, stat, sub }: { label: string; stat: string; sub: string }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right">
        <div className="nums text-sm font-semibold">{stat}</div>
        <div className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          {sub}
        </div>
      </dd>
    </div>
  )
}
