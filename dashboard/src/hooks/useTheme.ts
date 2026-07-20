import { useEffect } from "react"
import { useLocalStorage } from "./useLocalStorage"

type Theme = "light" | "dark"

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>(
    "sgh_theme",
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"))
  return { theme, toggle }
}
