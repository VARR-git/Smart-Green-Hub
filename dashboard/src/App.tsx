import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Bell,
  Eye,
  EyeOff,
  FileText,
  LayoutGrid,
  Leaf,
  Loader2,
  LockKeyhole,
  Moon,
  Settings2,
  Sun,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { useDemoStream } from "@/hooks/useDemoStream"
import { login, logout, observeAdminSession } from "@/lib/firebase"
import type { Thresholds } from "@/lib/types"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "monitor", label: "Monitor", icon: LayoutGrid },
  { id: "alert", label: "Peringatan", icon: Bell },
  { id: "report", label: "Laporan", icon: FileText },
  { id: "setting", label: "Pengaturan", icon: Settings2 },
] as const

type DataMode = "demo" | "realtime"

export default function App() {
  const { theme, toggle } = useTheme()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const stop = observeAdminSession(setAuthenticated)
    const fallback = window.setTimeout(
      () => setAuthenticated((value) => value ?? false),
      3000,
    )
    return () => {
      stop()
      window.clearTimeout(fallback)
    }
  }, [])

  if (authenticated === null) return <AuthLoading />
  if (!authenticated) {
    return <LoginScreen theme={theme} onToggleTheme={toggle} />
  }

  return <Dashboard theme={theme} onToggleTheme={toggle} />
}

function Dashboard({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark"
  onToggleTheme: () => void
}) {
  const { data, history, connected, error, clearHistory } = useHydroData()
  const [th, setTh] = useLocalStorage<Thresholds>(
    "sgh_thresholds",
    DEFAULT_THRESHOLDS,
  )
  const [dataMode, setDataMode] = useLocalStorage<DataMode>(
    "sgh_data_mode",
    "demo",
  )
  const [tab, setTab] = useState<string>("monitor")
  const demo = dataMode === "demo"
  const demoStream = useDemoStream(demo)
  const displayData = demo ? demoStream.data : data
  const displayHistory = demo ? demoStream.history : history

  const active = useMemo(
    () => (demo ? [] : computeActive(data, th, connected)),
    [data, demo, th, connected],
  )
  const { log, clear } = useAlertLog(active)

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      orientation="vertical"
      className="min-h-svh"
    >
      <Header
        data={displayData}
        connected={connected}
        demo={demo}
        onToggleDataMode={() => setDataMode(demo ? "realtime" : "demo")}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={() => void logout()}
      />

      <div className="dashboard-layout mx-auto grid w-full max-w-screen-2xl lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:px-6">
        <aside className="no-print hidden border-r border-border/80 pb-10 pr-6 pt-7 lg:flex lg:min-h-[calc(100svh-73px)] lg:flex-col">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Pusat kontrol
          </p>
          <TabsList className="flex h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
            {TABS.map(({ id, label, icon: Icon }, index) => (
              <TabsTrigger
                key={id}
                value={id}
                className="group justify-start gap-3 rounded-md px-3 py-3 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
              >
                <span className="nums text-[10px] opacity-45">0{index + 1}</span>
                <Icon className="size-4" />
                {label}
                {id === "alert" && active.length > 0 && (
                  <span className="ml-auto grid size-5 place-items-center rounded-sm bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {active.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-auto border-t border-border/80 px-3 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Node lapangan
            </p>
            <p className="mt-2 text-xs font-semibold">ESP32-S3 · Unit 01</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Firebase realtime stream
            </p>
          </div>
        </aside>

        <main className="dashboard-main min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-0 lg:pb-14 lg:pr-6 lg:pt-7">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-sm no-print">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Gagal terhubung ke Firebase
                </p>
                <p className="text-xs text-muted-foreground">
                  {error}. Pastikan akun ini memiliki izin pada Realtime Database.
                </p>
              </div>
            </div>
          )}

          <TabsContent value="monitor" className="mt-0">
            <MonitorTab
              data={displayData}
              history={displayHistory}
              connected={connected && !demo}
              demo={demo}
              onDemoActuator={demoStream.toggleActuator}
              th={th}
            />
          </TabsContent>
          <TabsContent value="alert" className="mt-0">
            <AlertTab active={active} log={log} onClearLog={clear} />
          </TabsContent>
          <TabsContent value="report" className="mt-0">
            <ReportTab
              data={displayData}
              history={displayHistory}
              th={th}
              demo={demo}
            />
          </TabsContent>
          <TabsContent value="setting" className="mt-0">
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
      </div>

      {/* Navigasi bawah — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-forest text-forest-foreground lg:hidden no-print">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  on ? "text-field" : "text-forest-foreground/55",
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

function AuthLoading() {
  return (
    <main className="grid min-h-svh place-items-center">
      <Loader2 className="size-6 animate-spin text-primary" aria-label="Memuat sesi" />
    </main>
  )
}

function LoginScreen({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark"
  onToggleTheme: () => void
}) {
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      await login(pin)
    } catch (cause) {
      const code = (cause as { code?: string }).code
      setError(
        code === "auth/too-many-requests"
          ? "Terlalu banyak percobaan. Coba lagi nanti."
          : "PIN admin salah.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative grid min-h-svh place-items-center p-5">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-5 top-5"
        onClick={onToggleTheme}
        aria-label="Ganti tema"
      >
        {theme === "dark" ? <Sun /> : <Moon />}
      </Button>

      <Card className="w-full max-w-sm border-border/80 shadow-[0_24px_80px_-32px_hsl(var(--primary)/0.35)]">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-7">
            <span className="mb-5 grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Leaf className="size-6" />
            </span>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Smart Green Hub</h1>
              <LockKeyhole className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Masukkan PIN admin untuk memantau dan mengatur sistem hidroponik.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5" htmlFor="pin">
              <span className="text-xs font-medium text-muted-foreground">PIN Admin</span>
              <span className="relative block">
                <input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  pattern="[0-9]{6,12}"
                  maxLength={12}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  className="h-11 w-full rounded-xl border bg-background px-3 pr-11 text-sm transition focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="6–12 digit"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                >
                  {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Memverifikasi..." : "Masuk ke dashboard"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Akses terbatas untuk pengelola Smart Green Hub.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
