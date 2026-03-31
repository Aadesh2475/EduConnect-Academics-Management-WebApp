"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

type ThemeOption = "light" | "dark" | "system"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const handleTheme = (value: ThemeOption) => (setTheme as (t: ThemeOption) => void)(value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleTheme("light")} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {(theme as ThemeOption) === "light" && <span className="ml-auto text-blue-600">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleTheme("dark")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {(theme as ThemeOption) === "dark" && <span className="ml-auto text-blue-600">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleTheme("system")} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {(theme as ThemeOption) === "system" && <span className="ml-auto text-blue-600">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
