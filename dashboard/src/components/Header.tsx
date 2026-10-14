import { FlaskConical, Leaf, LogOut, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HydroData } from "@/lib/types"

interface Props {
  data: HydroData | null
  connected: boolean
  demo: boolean
  onToggleDataMode: () => void
  theme: "light" | "dark"
  onToggleTheme: () => void
  onLogout: () => void
}

export function Header({
  data,
  connected,
  demo,
  onToggleDataMode,
  theme,
  onToggleTheme,
  onLogout,
}: Props) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-md bg-foreground text-background dark:bg-primary dark:text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-bold tracking-[-0.02em]">
              Smart Green Hub
            </h1>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Sistem hidroponik lapangan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDataMode}
            className={cn(
              "mr-1 flex size-9 items-center justify-center gap-2 rounded-md text-[11px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-auto md:w-auto md:justify-start md:border-r md:border-border md:pr-4",
              demo || connected
                ? "text-foreground"
                : "text-destructive",
            )}
            aria-label={demo ? "Ganti ke data realtime" : "Ganti ke mode simulasi"}
          >
            {demo ? (
              <FlaskConical className="size-3.5 text-warn" />
            ) : connected ? (
              <Wifi className="size-3.5 text-primary" />
            ) : (
              <WifiOff className="size-3.5" />
            )}
            <span className="hidden md:block">
              <span className="block font-semibold">
                {demo
                  ? "Mode simulasi"
                  : connected
                    ? "Realtime · online"
                    : "Realtime · offline"}
              </span>
              <span className="block text-[9px] font-normal text-muted-foreground">
                {demo
                  ? "Klik untuk realtime"
                  : data?.updatedAt
                    ? `Sinkron ${data.updatedAt}`
                    : "Belum ada sinkronisasi"}
              </span>
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={onToggleTheme}
            aria-label="Ganti tema"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={onLogout}
            aria-label="Keluar"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
