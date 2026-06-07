import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  canAccessModule,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type PermissionKey,
} from '@/lib/permissions'

export function usePermissions() {
  const { profile } = useAuth()
  const permissions = profile?.role?.permissions

  return useMemo(
    () => ({
      permissions,
      hasPermission: (key: PermissionKey | string) => hasPermission(permissions, key),
      hasAnyPermission: (keys: Array<PermissionKey | string>) =>
        hasAnyPermission(permissions, keys),
      hasAllPermissions: (keys: Array<PermissionKey | string>) =>
        hasAllPermissions(permissions, keys),
      canAccessModule: (module: Parameters<typeof canAccessModule>[1]) =>
        canAccessModule(permissions, module),
      isAdmin: profile?.role?.name === 'admin',
      isReceptionist: profile?.role?.name === 'receptionist',
      isProfessional: profile?.role?.name === 'professional',
    }),
    [permissions, profile?.role?.name]
  )
}
