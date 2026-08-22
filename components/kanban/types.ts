import type { TaskStatus, TaskPriority } from '@/lib/types';

// Re-export for convenience
export type { TaskStatus, TaskPriority };

export type Task = {
    id: string
    _id?: string
    title: string
    description: string
    assignee: string | null
    dueDate?: string
    labels?: string[]       // Changed from tags to labels for consistency with backend
    labelIds?: string[]     // For linking to BoardLabel by ID
    progress?: number
    completedDate?: string
    status?: TaskStatus     // Now properly typed
    priority?: TaskPriority // Now properly typed
    order?: number
}

export type ColumnId = "todo" | "in-progress" | "done"

export type BoardLabel = {
    id: string;
    _id?: string;  // MongoDB ID
    name: string;
    color: string
}
