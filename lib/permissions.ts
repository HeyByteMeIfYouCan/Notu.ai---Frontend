/**
 * Frontend Permission Utilities
 * Centralized role-based permission checks for UI components
 * 
 * Role Hierarchy: owner (4) > admin (3) > editor (2) > viewer (1)
 * 
 * Viewer: Can only view content, NO action buttons/icons visible
 * Editor: Can edit content, transcripts, ask AI, create tasks
 * Admin: Can share, manage collaborators, delete tasks, regenerate AI
 * Owner: Full access, can delete meeting, transfer ownership
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Permission {
  // Core permissions
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageCollaborators: boolean;
  
  // Task permissions
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canDragTasks: boolean;
  
  // AI permissions
  canRegenerateAI: boolean;
  canAskAI: boolean; // Can view and write to AI chat
  canWriteAI: boolean; // Can write/ask questions (editor+)
  
  // Export permissions
  canExport: boolean;
  canExportMedia: boolean;
  
  // Meeting-specific permissions
  canEditSegments: boolean;
  canEditSpeakers: boolean;
  canSyncTasks: boolean;
  canDeleteMeeting: boolean;
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditContent: boolean;
  
  // UI visibility permissions (what actions/icons to show)
  showShareButton: boolean;
  showDeleteButton: boolean;
  showEditActions: boolean;
  showExportDropdown: boolean;
  showCopyLink: boolean;
  showInfoButton: boolean;
  showNotionConnect: boolean;
  showKanbanActions: boolean;
  showAskAI: boolean;
  showRegenerateButton: boolean;
  showSpeakerEdit: boolean;
  showTranscriptEdit: boolean;
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
 * Viewer: Minimal access - view only, no action buttons
 * Editor: Can edit content but not share/delete/manage
 * Admin: Can share, manage, delete tasks, but not delete meeting
 * Owner: Full access
 */
export function getPermissions(role: UserRole | string | undefined): Permission {
  const normalizedRole = (role?.toLowerCase() || 'viewer') as UserRole;
  const level = ROLE_LEVELS[normalizedRole] || 1;
  
  // Viewer = level 1: View only, NO actions visible
  const isViewer = level === 1;
  const isEditor = level >= 2;
  const isAdmin = level >= 3;
  const isOwner = level >= 4;
  
  return {
    // Core permissions
    canView: true, // Everyone can view
    canEdit: isEditor,
    canDelete: isAdmin,
    canShare: isAdmin,
    canManageCollaborators: isAdmin,
    
    // Task permissions
    canCreateTasks: isEditor,
    canEditTasks: isEditor,
    canDeleteTasks: isAdmin,
    canDragTasks: isEditor,
    
    // AI permissions
    canRegenerateAI: isAdmin, // Only admin+ can regenerate AI notes
    canAskAI: true, // Everyone can view AI chat
    canWriteAI: isEditor, // Editor+ can ask questions
    
    // Export permissions
    canExport: true, // Everyone can export text formats
    canExportMedia: isEditor, // Editor+ can export media
    
    // Meeting-specific permissions
    canEditSegments: isEditor,
    canEditSpeakers: isEditor,
    canSyncTasks: isEditor,
    canDeleteMeeting: isOwner, // Only owner can delete meeting
    canEditTitle: isEditor,
    canEditDescription: isEditor,
    canEditContent: isEditor,
    
    // UI visibility - Viewer sees NOTHING, just content
    showShareButton: isAdmin,
    showDeleteButton: isOwner,
    showEditActions: isEditor,
    showExportDropdown: true, // Show but limit options based on role
    showCopyLink: isEditor, // Editor+ can copy link
    showInfoButton: true, // Everyone can see info
    showNotionConnect: isAdmin,
    showKanbanActions: isEditor,
    showAskAI: true, // Everyone can VIEW the Ask AI tab
    showRegenerateButton: isAdmin,
    showSpeakerEdit: isEditor,
    showTranscriptEdit: isEditor,
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
