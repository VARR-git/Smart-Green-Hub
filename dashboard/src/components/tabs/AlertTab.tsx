import { AlertTriangle, BellOff, CheckCircle2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clockOf } from "@/lib/format"
import type { AlertItem } from "@/lib/types"

interface Props {
  active: AlertItem[]
  log: AlertItem[]
  onClearLog: () => void
}

export function AlertTab({ active, log, onClearLog }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-xs font-medium text-muted-foreground">
            Peringatan Aktif
          </p>
          {active.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="size-8 text-primary" />
              <p className="text-sm font-medium">Semua terkendali</p>
              <p className="text-xs text-muted-foreground">
                Tidak ada parameter yang di luar ambang.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {active.map((a, i) => (
                <AlertRow key={i} a={a} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Riwayat Peringatan
            </p>
            {log.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={onClearLog}
              >
                <Trash2 className="size-3.5" /> Bersihkan
              </Button>
            )}
          </div>
          {log.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <BellOff className="size-7 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground">
                Belum ada riwayat. Peringatan baru muncul di sini.
              </p>
            </div>
          ) : (
            <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
              {log.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{a.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {a.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {clockOf(a.t)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AlertRow({ a }: { a: AlertItem }) {
  const danger = a.level === "danger"
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        danger
          ? "border-destructive/25 bg-destructive/[0.06]"
          : "border-warn/25 bg-warn/[0.06]",
      )}
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 size-4 shrink-0",
          danger ? "text-destructive" : "text-warn",
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium">{a.title}</p>
        <p className="text-xs text-muted-foreground">{a.detail}</p>
      </div>
    </div>
  )
}
