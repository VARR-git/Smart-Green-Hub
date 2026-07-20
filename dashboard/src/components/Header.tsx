import { Leaf, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HydroData } from "@/lib/types"

interface Props {
  data: HydroData | null
  connected: boolean
  theme: "light" | "dark"
  onToggleTheme: () => void
}

export function Header({ data, connected, theme, onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Leaf className="size-5" />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">
              Smart Green Hub
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Hidroponik · {data?.fw?.running ? `fw ${data.fw.running}` : "ESP32-S3"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              connected
                ? "bg-primary/10 text-primary"
                : "bg-destructive/12 text-destructive",
            )}
          >
            {connected ? (
              <Wifi className="size-3.5" />
            ) : (
              <WifiOff className="size-3.5" />
            )}
            {connected ? "Online" : "Offline"}
          </span>
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
        </div>
      </div>
    </header>
  )
}
