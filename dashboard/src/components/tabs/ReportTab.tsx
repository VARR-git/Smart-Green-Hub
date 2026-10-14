import { Download, Leaf, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clockOf, fmtNum } from "@/lib/format"
import { summarize, todays } from "@/lib/stats"
import type { HydroData, Sample, Thresholds } from "@/lib/types"

interface Props {
  data: HydroData | null
  history: Sample[]
  th: Thresholds
  demo: boolean
}

export function ReportTab({ data, history, th, demo }: Props) {
  const today = todays(history)
  const now = new Date()
  const rows = [
    {
      label: "pH larutan",
      stat: summarize(today, "ph"),
      digits: 2,
      unit: "",
      safeMin: th.phMin,
      safeMax: th.phMax,
    },
    {
      label: "Nutrisi (TDS)",
      stat: summarize(today, "tds"),
      digits: 0,
      unit: " ppm",
      safeMin: th.tdsMin,
      safeMax: th.tdsMax,
    },
    {
      label: "Suhu lingkungan",
      stat: summarize(today, "temp"),
      digits: 1,
      unit: " °C",
      safeMin: th.tempMin,
      safeMax: th.tempMax,
    },
    {
      label: "Kelembaban",
      stat: summarize(today, "humi"),
      digits: 0,
      unit: " %",
      safeMin: 40,
      safeMax: 90,
    },
  ]
  const metrics = [
    {
      label: "pH saat ini",
      value: fmtNum(data?.ph ?? null, 2),
      unit: "pH",
      target: `${th.phMin}—${th.phMax}`,
    },
    {
      label: "TDS saat ini",
      value: fmtNum(data?.tds ?? null),
      unit: "ppm",
      target: `${th.tdsMin}—${th.tdsMax}`,
    },
    {
      label: "Suhu saat ini",
      value: fmtNum(data?.temperature ?? null, 1),
      unit: "°C",
      target: `${th.tempMin}—${th.tempMax}`,
    },
    {
      label: "Kelembaban",
      value: fmtNum(data?.humidity ?? null),
      unit: "%",
      target: "40—90",
    },
  ]
  const tanggal = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const reportCode = `SGH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const generatedAt = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const period = today.length
    ? `${clockOf(today[0].t)}—${clockOf(today[today.length - 1].t)}`
    : "Belum tersedia"

  const shareText = () => {
    const lines = rows
      .filter((row) => row.stat)
      .map(
        (row) =>
          `${row.label}: ${row.stat!.min.toFixed(row.digits)}–${row.stat!.max.toFixed(
            row.digits,
          )}${row.unit} (rata ${row.stat!.avg.toFixed(row.digits)})`,
      )
    return `${demo ? "[DATA SIMULASI] " : ""}Laporan Smart Green Hub — ${tanggal}\n${lines.join("\n")}`
  }

  const onShare = async () => {
    const text = shareText()
    if (navigator.share) {
      try {
        await navigator.share({ title: "Laporan Smart Green Hub", text })
        return
      } catch {
        /* dibatalkan */
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      alert("Ringkasan disalin ke clipboard.")
    } catch {
      alert(text)
    }
  }

  return (
    <div className="report-shell mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Arsip operasional
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Laporan harian</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Siap dibagikan atau dicetak sebagai PDF A4.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 /> Bagikan
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Download /> Ekspor PDF
          </Button>
        </div>
      </div>

      <article className="report-sheet overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        <header className="report-document-header flex items-center justify-between bg-forest px-6 py-5 text-forest-foreground sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-field text-forest">
              <Leaf className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">Smart Green Hub</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-forest-foreground/60">
                Sistem hidroponik lapangan
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="nums text-[10px] font-bold tracking-[0.12em]">{reportCode}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-forest-foreground/60">
              Laporan otomatis
            </p>
          </div>
        </header>

        {demo && (
          <div className="report-demo-banner border-b border-warn/30 bg-warn/15 px-6 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-warn sm:px-8">
            Data simulasi · bukan pembacaan perangkat
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="mb-7 grid gap-5 border-b border-border pb-7 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Instalasi utama · Reservoir A
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                Laporan Operasional Harian
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{tanggal}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-right">
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Node</dt>
                <dd className="mt-0.5 font-semibold">ESP32-S3 · Unit 01</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sinkron</dt>
                <dd className="mt-0.5 font-semibold">
                  {demo ? "Simulasi" : data?.updatedAt || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <section className="mb-7">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Kondisi terakhir
                </p>
                <h2 className="mt-0.5 text-sm font-semibold">Pembacaan sensor</h2>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {demo ? "Dataset contoh" : `Pembaruan ${data?.updatedAt || "—"}`}
              </p>
            </div>
            <div className="report-metrics grid grid-cols-2 border border-border sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="report-metric border-b border-r border-border p-4 even:border-r-0 sm:border-b-0 sm:even:border-r sm:last:border-r-0">
                  <p className="text-[10px] font-semibold text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="nums text-2xl font-bold tracking-tight">{metric.value}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{metric.unit}</span>
                  </p>
                  <p className="mt-2 text-[9px] uppercase tracking-wide text-muted-foreground">
                    Ambang {metric.target}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="report-table mb-7">
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Rekap pengukuran
              </p>
              <h2 className="mt-0.5 text-sm font-semibold">Rentang data hari ini</h2>
            </div>
            <div className="overflow-hidden border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary text-left text-[9px] font-bold uppercase tracking-[0.1em] text-secondary-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Parameter</th>
                    <th className="px-3 py-2.5 text-right font-bold">Minimum</th>
                    <th className="px-3 py-2.5 text-right font-bold">Rata-rata</th>
                    <th className="px-3 py-2.5 text-right font-bold">Maksimum</th>
                    <th className="px-3 py-2.5 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const stable =
                      row.stat &&
                      row.stat.min >= row.safeMin &&
                      row.stat.max <= row.safeMax
                    return (
                      <tr key={row.label} className="border-t border-border">
                        <td className="px-3 py-3 font-semibold">{row.label}</td>
                        <td className="nums px-3 py-3 text-right">
                          {row.stat ? `${row.stat.min.toFixed(row.digits)}${row.unit}` : "—"}
                        </td>
                        <td className="nums px-3 py-3 text-right font-semibold">
                          {row.stat ? `${row.stat.avg.toFixed(row.digits)}${row.unit}` : "—"}
                        </td>
                        <td className="nums px-3 py-3 text-right">
                          {row.stat ? `${row.stat.max.toFixed(row.digits)}${row.unit}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={stable ? "report-status-ok inline-block bg-secondary px-2 py-1 text-[9px] font-bold text-secondary-foreground" : "report-status-warn inline-block bg-warn/15 px-2 py-1 text-[9px] font-bold text-warn"}>
                            {row.stat ? (stable ? "Stabil" : "Perlu cek") : "Tanpa data"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-summary grid gap-4 sm:grid-cols-2">
            <div className="border-l-2 border-primary pl-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Ambang operasi
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                pH {th.phMin}—{th.phMax} · TDS {th.tdsMin}—{th.tdsMax} ppm<br />
                Suhu {th.tempMin}—{th.tempMax} °C · Kelembaban 40—90%
              </p>
            </div>
            <div className="border-l-2 border-water pl-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Cakupan rekaman
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                {today.length} sampel tersimpan<br />
                Periode {period}
              </p>
            </div>
          </section>

          <footer className="mt-7 flex items-center justify-between border-t border-border pt-4 text-[9px] text-muted-foreground">
            <p>Dibuat otomatis oleh Smart Green Hub</p>
            <p className="nums">Dicetak {generatedAt} WIB</p>
          </footer>
        </div>
      </article>
    </div>
  )
}
