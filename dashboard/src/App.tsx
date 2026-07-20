import { useMemo, useState } from "react"
import { Bell, LayoutGrid, Settings2, FileText, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/Header"
import { MonitorTab } from "@/components/tabs/MonitorTab"
import { AlertTab } from "@/components/tabs/AlertTab"
import { ReportTab } from "@/components/tabs/ReportTab"
import { SettingTab } from "@/components/tabs/SettingTab"
import { useHydroData } from "@/hooks/useHydroData"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useTheme } from "@/hooks/useTheme"
import { computeActive, useAlertLog } from "@/hooks/useAlerts"
import { DEFAULT_THRESHOLDS } from "@/lib/plants"
import type { Thresholds } from "@/lib/types"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "monitor", label: "Monitor", icon: LayoutGrid },
  { id: "alert", label: "Peringatan", icon: Bell },
  { id: "report", label: "Laporan", icon: FileText },
  { id: "setting", label: "Pengaturan", icon: Settings2 },
] as const

export default function App() {
  const { theme, toggle } = useTheme()
  const { data, history, connected, error, clearHistory } = useHydroData()
  const [th, setTh] = useLocalStorage<Thresholds>(
    "sgh_thresholds",
    DEFAULT_THRESHOLDS,
  )
  const [tab, setTab] = useState<string>("monitor")

  const active = useMemo(
    () => computeActive(data, th, connected),
    [data, th, connected],
  )
  const { log, clear } = useAlertLog(active)

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-svh">
      <Header
        data={data}
        connected={connected}
        theme={theme}
        onToggleTheme={toggle}
      />

      <main className="container max-w-5xl pb-28 pt-5 lg:pb-12">
        <TabsList className="mb-5 hidden w-full justify-start gap-1 lg:inline-flex no-print">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-1.5">
              <Icon className="size-4" />
              {label}
              {id === "alert" && active.length > 0 && (
                <span className="ml-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {active.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-sm no-print">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Gagal terhubung ke Firebase
              </p>
              <p className="text-xs text-muted-foreground">
                {error}. Pastikan provider Anonymous aktif dan domain ini
                terdaftar di Authentication → Settings → Authorized domains.
              </p>
            </div>
          </div>
        )}

        <TabsContent value="monitor">
          <MonitorTab
            data={data}
            history={history}
            connected={connected}
            th={th}
          />
        </TabsContent>
        <TabsContent value="alert">
          <AlertTab active={active} log={log} onClearLog={clear} />
        </TabsContent>
        <TabsContent value="report">
          <ReportTab data={data} history={history} th={th} />
        </TabsContent>
        <TabsContent value="setting">
          <div className="mb-4 flex justify-end no-print">
            <button
              onClick={clearHistory}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Hapus riwayat grafik lokal
            </button>
          </div>
          <SettingTab th={th} onSave={setTh} />
        </TabsContent>
      </main>

      {/* Navigasi bawah — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/90 backdrop-blur-md lg:hidden no-print">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  on ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
                {id === "alert" && active.length > 0 && (
                  <span className="absolute right-[22%] top-1.5 size-2 rounded-full bg-destructive" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </Tabs>
  )
}
