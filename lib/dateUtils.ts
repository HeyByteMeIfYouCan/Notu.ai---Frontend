/**
 * Date formatting utilities for the application
 */

/**
 * Format a due date relative to now
 * Returns: 'Late', 'Today', 'Tmr', '3d', or formatted date
 */
export function formatDueDate(
  dueDate: string | Date | null | undefined,
  options: { showRelative?: boolean; fallback?: string } = {}
): string {
  const { showRelative = true, fallback = '-' } = options;
  
  if (!dueDate) return fallback;
  
  try {
    const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    // Check for invalid date
    if (isNaN(d.getTime())) return fallback;
    
    const now = new Date();
    // Reset time portion for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (showRelative) {
      if (diffDays < -7) {
        // More than a week late - show date with "Late" indicator
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }
      if (diffDays < 0) return `${Math.abs(diffDays)}d late`;
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tmr';
      if (diffDays <= 7) return `${diffDays}d`;
      
      // More than a week away - show date
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
    
    // Non-relative format
    return d.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return fallback;
  }
}

/**
 * Format a date for display (e.g., "2 Jan 2025")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

/**
 * Format time only (e.g., "14:30")
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

/**
 * Format duration in seconds to human readable (e.g., "1h 30m")
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const isFuture = diffMs < 0;
    const prefix = isFuture ? 'dalam ' : '';
    const suffix = isFuture ? '' : ' lalu';
    
    if (diffSeconds < 60) return 'baru saja';
    if (diffMinutes < 60) return `${prefix}${diffMinutes} menit${suffix}`;
    if (diffHours < 24) return `${prefix}${diffHours} jam${suffix}`;
    if (diffDays < 7) return `${prefix}${diffDays} hari${suffix}`;
    
    return formatDate(d);
  } catch {
    return '-';
  }
}
