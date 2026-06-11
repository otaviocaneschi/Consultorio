import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileBarChart,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
  Package,
  ClipboardList,
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
import { usePermissions } from "@/hooks/usePermissions"

const allNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, alwaysShow: true },
  { title: "Pacientes", href: "/pacientes", icon: Users, alwaysShow: true },
  { title: "Agenda", href: "/agenda", icon: Calendar, alwaysShow: true },
  { title: "Procedimentos", href: "/procedimentos", icon: Stethoscope, alwaysShow: true },
  { title: "Materiais", href: "/materiais", icon: Package, alwaysShow: true },
  { title: "Financeiro", href: "/financeiro", icon: DollarSign, alwaysShow: true },
  { title: "Relatórios", href: "/relatorios", icon: FileBarChart, alwaysShow: true },
  { title: "Usuários", href: "/usuarios", icon: ClipboardList, adminOnly: true },
  { title: "Configurações", href: "/configuracoes", icon: Settings, alwaysShow: true },
] as const

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  clinicName?: string
  professionalName?: string
}

export function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  clinicName = 'Clínica',
  professionalName,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const { isAdmin } = usePermissions()

  const toggleCollapsed = () => {
    const next = !collapsed
    setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  // Filter nav items based on role
  const navItems = allNavItems.filter(
    (item) => item.alwaysShow || (item.adminOnly && isAdmin)
  )

  const initials = (professionalName ?? clinicName)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-semibold leading-tight text-foreground">
                  {professionalName ?? clinicName}
                </span>
                <span className="truncate text-xs text-muted-foreground">{clinicName}</span>
              </div>
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

        {/* Navigation */}
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
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                        : "text-sidebar-foreground",
                      collapsed && "justify-center px-2"
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
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

        {/* Footer */}
        <Separator />
        <div className={cn("p-4", collapsed && "flex justify-center p-2")}>
          {!collapsed ? (
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {clinicName}
            </p>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
