import { useDroppable } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconGripVertical, IconInbox } from "@tabler/icons-react"
import { Task, ColumnId, BoardLabel } from "./types"
import { TaskCard } from "./TaskCard"
import { useState } from "react"

interface KanbanColumnProps {
  id: ColumnId
  title: string
  tasks: Task[]
  color: string
  bgLight?: string
  bgDark?: string
  labels: BoardLabel[]
  onAddTask: () => void
  onEditTask: (task: Task) => void
  members?: { id: string, name: string }[]
  canModify?: boolean
  isLoading?: boolean
}

function SortableTaskCard({ 
  task, 
  labels, 
  onClick, 
  members, 
  canModify 
}: { 
  task: Task
  labels: BoardLabel[]
  onClick: (t: Task) => void
  members?: { id: string, name: string }[]
  canModify?: boolean 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id, 
    disabled: !canModify 
  })
  const [isDraggingState, setIsDraggingState] = useState(false)
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const dragProps = canModify ? { 
    ...attributes, 
    ...listeners,
    onMouseDown: (e: React.MouseEvent) => {
      setIsDraggingState(false)
      listeners?.onMouseDown?.(e as any)
    },
    onMouseMove: (e: React.MouseEvent) => {
      if (e.buttons === 1) setIsDraggingState(true)
      listeners?.onMouseMove?.(e as any)
    },
    onMouseUp: (e: React.MouseEvent) => {
      listeners?.onMouseUp?.(e as any)
      setTimeout(() => setIsDraggingState(false), 10)
    },
  } : {}

  const handleClick = (task: Task) => {
    if (!isDraggingState) {
      onClick(task)
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${canModify ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...dragProps}
    >
      {canModify && (
        <div className="absolute left-1.5 top-3 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity pointer-events-none z-10">
          <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      <TaskCard 
        task={task} 
        onClick={handleClick} 
        labels={labels} 
        members={members} 
      />
    </div>
  )
}

function TaskSkeleton() {
  return (
    <Card className="mb-3 border border-border/50 bg-card/60 animate-pulse rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded-md w-3/4" />
          <div className="h-4 bg-muted rounded-full w-12" />
        </div>
        <div className="h-3 bg-muted/60 rounded w-full" />
        <div className="h-3 bg-muted/60 rounded w-2/3" />
        <div className="flex justify-between pt-2 border-t border-border/40">
          <div className="h-4 bg-muted rounded-full w-16" />
          <div className="h-4 bg-muted rounded-md w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

const columnTheme: Record<ColumnId, { dotColor: string; topBorder: string; badgeVariant: string }> = {
  'todo': {
    dotColor: 'bg-blue-500',
    topBorder: 'from-blue-500 to-sky-500',
    badgeVariant: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  },
  'in-progress': {
    dotColor: 'bg-amber-500',
    topBorder: 'from-amber-500 to-orange-500',
    badgeVariant: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  'done': {
    dotColor: 'bg-emerald-500',
    topBorder: 'from-emerald-500 to-teal-500',
    badgeVariant: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
}

export function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  labels, 
  onAddTask, 
  onEditTask, 
  members, 
  canModify = true, 
  isLoading = false 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const theme = columnTheme[id] || {
    dotColor: 'bg-primary',
    topBorder: 'from-primary to-primary/60',
    badgeVariant: 'bg-muted text-foreground border-border/60',
  }

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col rounded-2xl p-3 sm:p-3.5 transition-all duration-200 border ${
        isOver 
          ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/20 shadow-md' 
          : 'bg-muted/30 dark:bg-muted/10 border-border/60 shadow-2xs'
      }`}
    >
      {/* Column Top Accent Line */}
      <div className={`h-1 w-full rounded-full bg-gradient-to-r ${theme.topBorder} mb-3 opacity-80`} />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.dotColor} ring-2 ring-background shrink-0`} />
          <h2 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">{title}</h2>
          <Badge 
            variant="outline" 
            className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${theme.badgeVariant}`}
          >
            {tasks.length}
          </Badge>
        </div>
        
        {canModify && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/90 transition-all duration-150 hover:scale-105 active:scale-95"
            onClick={onAddTask}
            title="Tambah task"
          >
            <IconPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tasks Container */}
      <SortableContext items={tasks.filter(Boolean).map((t) => t.id)} strategy={rectSortingStrategy}>
        <div className="flex-1 space-y-2.5 min-h-[160px]">
          {isLoading ? (
            <>
              <TaskSkeleton />
              <TaskSkeleton />
            </>
          ) : (
            <>
              {tasks.filter(Boolean).map((task) => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task} 
                  labels={labels}
                  onClick={onEditTask} 
                  members={members}
                  canModify={canModify}
                />
              ))}
              
              {tasks.length === 0 && !isLoading && (
                <div className={`flex flex-col items-center justify-center h-32 text-center rounded-xl border border-dashed transition-colors p-4 ${
                  isOver 
                    ? 'border-primary/50 bg-primary/5 text-primary' 
                    : 'border-border/60 bg-card/20 text-muted-foreground'
                }`}>
                  <IconInbox className="h-6 w-6 mb-1 opacity-40" />
                  <p className="text-xs font-medium">
                    {isOver ? 'Lepaskan di sini' : 'Belum ada task'}
                  </p>
                  {canModify && !isOver && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={onAddTask}
                      className="text-xs text-primary hover:underline h-auto p-0 mt-1 font-medium transition-colors"
                    >
                      + Buat task baru
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SortableContext>

      {/* Bottom quick add button */}
      {canModify && tasks.length > 0 && (
        <Button 
          variant="ghost" 
          onClick={onAddTask}
          className="mt-3 w-full justify-center h-8.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/90 dark:hover:bg-card/70 rounded-xl border border-dashed border-border/60 hover:border-primary/40 transition-all duration-150 gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.99]"
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span>Tambah Task</span>
        </Button>
      )}
    </div>
  )
}
