import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionKey } from '@/lib/permissions'

interface RoleGuardProps {
  children: React.ReactNode
  permission?: PermissionKey | string
  adminOnly?: boolean
  fallback?: string
}

export function RoleGuard({
  children,
  permission,
  adminOnly = false,
  fallback = '/',
}: RoleGuardProps) {
  const { hasPermission, isAdmin } = usePermissions()

  if (adminOnly && !isAdmin) {
    return <Navigate to={fallback} replace />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
