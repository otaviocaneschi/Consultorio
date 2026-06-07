import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileBarChart,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Pacientes", href: "/pacientes", icon: Users },
  { title: "Agenda", href: "/agenda", icon: Calendar },
  { title: "Procedimentos", href: "/procedimentos", icon: Stethoscope },
  { title: "Financeiro", href: "/financeiro", icon: DollarSign },
  { title: "Relatórios", href: "/relatorios", icon: FileBarChart },
  { title: "Usuários", href: "/usuarios", icon: ClipboardList },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
] as const

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed

  const toggleCollapsed = () => {
    const next = !collapsed
    setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight text-sidebar-primary">
                Marcela Caneschi
              </span>
              <span className="text-xs text-muted-foreground">Clínica</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {collapsed ? "Expandir menu" : "Recolher menu"}
            </span>
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const link = (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                        : "text-sidebar-foreground",
                      collapsed && "justify-center px-2"
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </nav>
        </ScrollArea>

        <Separator />
        <div className={cn("p-4", collapsed && "flex justify-center p-2")}>
          {!collapsed ? (
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Marcela Caneschi
            </p>
          ) : (
            <span className="text-xs font-semibold text-sidebar-primary">MC</span>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
