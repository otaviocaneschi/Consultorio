export const PERMISSIONS = {
  dashboard: { read: "dashboard:read" },
  patients: { read: "patients:read", write: "patients:write", delete: "patients:delete" },
  agenda: { read: "agenda:read", write: "agenda:write", delete: "agenda:delete" },
  procedures: { read: "procedures:read", write: "procedures:write", delete: "procedures:delete" },
  financial: { read: "financial:read", write: "financial:write", delete: "financial:delete" },
  reports: { read: "reports:read", export: "reports:export" },
  users: { read: "users:read", write: "users:write", delete: "users:delete" },
  settings: { read: "settings:read", write: "settings:write" },
} as const

export type PermissionKey =
  | (typeof PERMISSIONS)["dashboard"]["read"]
  | (typeof PERMISSIONS)["patients"][keyof (typeof PERMISSIONS)["patients"]]
  | (typeof PERMISSIONS)["agenda"][keyof (typeof PERMISSIONS)["agenda"]]
  | (typeof PERMISSIONS)["procedures"][keyof (typeof PERMISSIONS)["procedures"]]
  | (typeof PERMISSIONS)["financial"][keyof (typeof PERMISSIONS)["financial"]]
  | (typeof PERMISSIONS)["reports"][keyof (typeof PERMISSIONS)["reports"]]
  | (typeof PERMISSIONS)["users"][keyof (typeof PERMISSIONS)["users"]]
  | (typeof PERMISSIONS)["settings"][keyof (typeof PERMISSIONS)["settings"]]

export type RolePermissions = Record<string, boolean>

export interface UserRole {
  id: string
  name: string
  permissions: RolePermissions
}

function normalizePermissions(
  permissions: RolePermissions | null | undefined
): RolePermissions {
  if (!permissions || typeof permissions !== "object") {
    return {}
  }
  return permissions
}

export function hasPermission(
  permissions: RolePermissions | null | undefined,
  permission: PermissionKey | string
): boolean {
  const normalized = normalizePermissions(permissions)
  return normalized[permission] === true
}

export function hasAnyPermission(
  permissions: RolePermissions | null | undefined,
  required: Array<PermissionKey | string>
): boolean {
  return required.some((permission) => hasPermission(permissions, permission))
}

export function hasAllPermissions(
  permissions: RolePermissions | null | undefined,
  required: Array<PermissionKey | string>
): boolean {
  return required.every((permission) => hasPermission(permissions, permission))
}

export function canAccessModule(
  permissions: RolePermissions | null | undefined,
  module: keyof typeof PERMISSIONS
): boolean {
  const modulePermissions = Object.values(PERMISSIONS[module])
  return hasAnyPermission(permissions, modulePermissions)
}

export function getGrantedPermissions(
  permissions: RolePermissions | null | undefined
): string[] {
  return Object.entries(normalizePermissions(permissions))
    .filter(([, granted]) => granted === true)
    .map(([key]) => key)
}

export function mergeRolePermissions(
  ...roles: Array<RolePermissions | null | undefined>
): RolePermissions {
  return roles.reduce<RolePermissions>((merged, role) => {
    const normalized = normalizePermissions(role)
    for (const [key, value] of Object.entries(normalized)) {
      if (value === true) {
        merged[key] = true
      }
    }
    return merged
  }, {})
}
