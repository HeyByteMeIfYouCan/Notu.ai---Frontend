"use client"

import { ReactNode } from "react"
import { hasPermission, Permission } from "@/lib/permissions"

interface PermissionGuardProps {
  children: ReactNode
  userRole?: string
  permission: keyof Permission
  fallback?: ReactNode
}

/**
 * PermissionGuard component
 * Conditionally renders children based on user's permission
 * 
 * Usage:
 * <PermissionGuard userRole={userRole} permission="canEdit">
 *   <EditButton />
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  children, 
  userRole, 
  permission,
  fallback = null 
}: PermissionGuardProps) {
  const allowed = hasPermission(userRole, permission)
  
  if (!allowed) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Hook to check multiple permissions at once
 */
export function usePermissions(userRole?: string) {
  return {
    can: (permission: keyof Permission) => hasPermission(userRole, permission),
    canEdit: hasPermission(userRole, 'canEdit'),
    canDelete: hasPermission(userRole, 'canDelete'),
    canShare: hasPermission(userRole, 'canShare'),
    canManageCollaborators: hasPermission(userRole, 'canManageCollaborators'),
    canEditSegments: hasPermission(userRole, 'canEditSegments'),
    canAskAI: hasPermission(userRole, 'canAskAI'),
    canSyncTasks: hasPermission(userRole, 'canSyncTasks'),
    canDeleteMeeting: hasPermission(userRole, 'canDeleteMeeting'),
    canRegenerateAI: hasPermission(userRole, 'canRegenerateAI'),
    canExport: hasPermission(userRole, 'canExport'),
    isViewer: userRole === 'viewer',
    isEditor: userRole === 'editor',
    isAdmin: userRole === 'admin',
    isOwner: userRole === 'owner',
  }
}
