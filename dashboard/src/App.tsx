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
import { login, logout, observeAdminSession } from "@/lib/firebase"
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
        onToggleTheme={onToggleTheme}
        onLogout={() => void logout()}
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
                {error}. Pastikan akun ini memiliki izin pada Realtime Database.
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
                  className="h-11 w-full rounded-xl border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
