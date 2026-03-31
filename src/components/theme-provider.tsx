"use client"

import { createContext, useContext, useEffect, ReactNode } from "react"

type Theme = "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Force dark mode permanently
  useEffect(() => {
    document.documentElement.classList.remove("light", "system")
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: "dark", setTheme: () => {}, resolvedTheme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
