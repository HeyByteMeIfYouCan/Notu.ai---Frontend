/**
 * Frontend Permission Utilities
 * Centralized role-based permission checks for UI components
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Permission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageCollaborators: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canDragTasks: boolean;
  canRegenerateAI: boolean;
  canExport: boolean;
}

/**
 * Role hierarchy: owner > admin > editor > viewer
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Get all permissions for a given role
 */
export function getPermissions(role: UserRole | string | undefined): Permission {
  const normalizedRole = (role?.toLowerCase() || 'viewer') as UserRole;
  
  const level = ROLE_LEVELS[normalizedRole] || 1;
  
  return {
    // All roles can view
    canView: level >= 1,
    
    // Editor+ can edit content
    canEdit: level >= 2,
    
    // Owner only can delete resources
    canDelete: level >= 4,
    
    // Owner and Admin can share
    canShare: level >= 3,
    
    // Owner and Admin can manage collaborators
    canManageCollaborators: level >= 3,
    
    // Editor+ can create tasks
    canCreateTasks: level >= 2,
    
    // Editor+ can edit tasks
    canEditTasks: level >= 2,
    
    // Owner and Admin can delete tasks
    canDeleteTasks: level >= 3,
    
    // Editor+ can drag/reorder tasks
    canDragTasks: level >= 2,
    
    // Editor+ can regenerate AI notes
    canRegenerateAI: level >= 2,
    
    // All roles can export
    canExport: level >= 1,
  };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  role: UserRole | string | undefined,
  action: keyof Permission
): boolean {
  return getPermissions(role)[action];
}

/**
 * Check if user can assign a specific role to another user
 * Owner can assign any role except owner
 * Admin can assign editor or viewer only
 */
export function canAssignRole(
  currentRole: UserRole | string | undefined,
  targetRole: UserRole | string
): boolean {
  const currentLevel = ROLE_LEVELS[(currentRole?.toLowerCase() || 'viewer') as UserRole] || 1;
  const targetLevel = ROLE_LEVELS[(targetRole.toLowerCase()) as UserRole] || 0;
  
  // Can't assign owner role
  if (targetRole.toLowerCase() === 'owner') return false;
  
  // Must be at least admin to assign roles
  if (currentLevel < 3) return false;
  
  // Can only assign roles below your level
  return currentLevel > targetLevel;
}

/**
 * Get display label for a role
 */
export function getRoleLabel(role: UserRole | string | undefined): string {
  switch (role?.toLowerCase()) {
    case 'owner': return 'Owner';
    case 'admin': return 'Admin';
    case 'editor': return 'Editor';
    case 'viewer': return 'Viewer';
    default: return 'Viewer';
  }
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(currentRole: UserRole | string | undefined): UserRole[] {
  if (currentRole === 'owner') {
    return ['admin', 'editor', 'viewer'];
  }
  if (currentRole === 'admin') {
    return ['editor', 'viewer'];
  }
  return [];
}

/**
 * Check if role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ['owner', 'admin', 'editor', 'viewer'].includes(role.toLowerCase());
}
