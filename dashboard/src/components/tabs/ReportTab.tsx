import { Download, FileText, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fmtNum } from "@/lib/format"
import { summarize, todays } from "@/lib/stats"
import type { HydroData, Sample, Thresholds } from "@/lib/types"

interface Props {
  data: HydroData | null
  history: Sample[]
  th: Thresholds
}

export function ReportTab({ data, history, th }: Props) {
  const today = todays(history)
  const rows = [
    { label: "pH", stat: summarize(today, "ph"), d: 2, unit: "" },
    { label: "Nutrisi (TDS)", stat: summarize(today, "tds"), d: 0, unit: " ppm" },
    { label: "Suhu", stat: summarize(today, "temp"), d: 1, unit: " °C" },
    { label: "Kelembaban", stat: summarize(today, "humi"), d: 0, unit: " %" },
  ]
  const tanggal = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const shareText = () => {
    const lines = rows
      .filter((r) => r.stat)
      .map(
        (r) =>
          `${r.label}: ${r.stat!.min.toFixed(r.d)}–${r.stat!.max.toFixed(
            r.d,
          )}${r.unit} (rata ${r.stat!.avg.toFixed(r.d)})`,
      )
    return `Laporan Smart Green Hub — ${tanggal}\n${lines.join("\n")}`
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-sm font-semibold">Laporan Harian</h2>
          <p className="text-xs text-muted-foreground">
            Ringkasan otomatis dari data hari ini.
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

      <Card className="print-open">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-2 border-b border-border/60 pb-4">
            <FileText className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Smart Green Hub</p>
              <p className="text-xs text-muted-foreground">{tanggal}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <Now label="pH saat ini" value={fmtNum(data?.ph ?? null, 2)} />
            <Now
              label="TDS saat ini"
              value={`${fmtNum(data?.tds ?? null)} ppm`}
            />
            <Now
              label="Suhu saat ini"
              value={`${fmtNum(data?.temperature ?? null, 1)} °C`}
            />
            <Now
              label="Kelembaban"
              value={`${fmtNum(data?.humidity ?? null)} %`}
            />
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Parameter</th>
                <th className="py-2 text-right font-medium">Min</th>
                <th className="py-2 text-right font-medium">Rata</th>
                <th className="py-2 text-right font-medium">Maks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border/40">
                  <td className="py-2.5">{r.label}</td>
                  <td className="nums py-2.5 text-right">
                    {r.stat ? r.stat.min.toFixed(r.d) : "—"}
                  </td>
                  <td className="nums py-2.5 text-right font-medium">
                    {r.stat ? r.stat.avg.toFixed(r.d) : "—"}
                  </td>
                  <td className="nums py-2.5 text-right">
                    {r.stat ? r.stat.max.toFixed(r.d) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-6 text-[11px] text-muted-foreground">
            Ambang aman — pH {th.phMin}–{th.phMax} · TDS {th.tdsMin}–{th.tdsMax}{" "}
            ppm · {today.length} sampel tercatat.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Now({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="nums mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
