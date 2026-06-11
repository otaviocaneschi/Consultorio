import { LogOut, Settings, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/layout/NotificationBell"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

interface HeaderProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
  onSignOut?: () => void
}

export function Header({
  userName = 'Profissional',
  userEmail = '',
  userAvatar,
  onSignOut,
}: HeaderProps) {
  const navigate = useNavigate()

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Left side: greeting */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{userName}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      {/* Right side: actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
              <User className="mr-2 h-4 w-4" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onSignOut?.()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
