import { useDroppable } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconDots, IconPlus, IconGripVertical } from "@tabler/icons-react"
import { Task, ColumnId, BoardLabel } from "./types"
import { TaskCard } from "./TaskCard"
import { useState } from "react"

interface KanbanColumnProps {
  id: ColumnId
  title: string
  tasks: Task[]
  color: string
  bgLight: string
  bgDark: string
  labels: BoardLabel[]
  onAddTask: () => void
  onEditTask: (task: Task) => void
  members?: { id: string, name: string }[]
  canModify?: boolean
  isLoading?: boolean
}

function SortableTaskCard({ task, labels, onClick, showProgress, members, canModify }: { task: Task; labels: BoardLabel[]; onClick: (t: Task) => void; showProgress?: boolean; members?: { id: string, name: string }[]; canModify?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !canModify })
  const [isDraggingState, setIsDraggingState] = useState(false)
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  // Spread drag listeners to entire card for easier dragging
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
      {/* Show grip icon on hover as visual indicator */}
      {canModify && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <TaskCard task={task} showProgress={showProgress} onClick={handleClick} labels={labels} members={members} />
    </div>
  )
}

// Loading skeleton for tasks
function TaskSkeleton() {
  return (
    <Card className="mb-3 animate-pulse">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function KanbanColumn({ id, title, tasks, color, bgLight, bgDark, labels, onAddTask, onEditTask, members, canModify = true, isLoading = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const showProgress = id === 'in-progress'

  return (
    <div 
      ref={setNodeRef} 
      className={`rounded-xl transition-all duration-200 ${
        isOver 
          ? 'ring-2 ring-[var(--primary)] ring-offset-2 bg-[var(--primary)]/5' 
          : bgLight
      }`}
    >
      <div className="space-y-4 p-2">
        {/* Header */}
        <div className="sticky top-0 bg-inherit pt-2 pb-1 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shadow-sm`} style={{ backgroundColor: color }}></span>
              <h2 className="font-semibold text-base">{title}</h2>
              <Badge variant="secondary" className="ml-1 bg-white/80 text-gray-700 font-medium text-xs">
                {tasks.length}
              </Badge>
            </div>
            <IconDots className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
          </div>
          <div className={`mt-3 h-1 rounded-full`} style={{ backgroundColor: bgDark }}></div>
        </div>

        {/* Tasks List */}
        <SortableContext items={tasks.filter(Boolean).map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className="space-y-3 min-h-[100px]">
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
                    showProgress={showProgress} 
                    members={members}
                    canModify={canModify}
                  />
                ))}
                
                {tasks.length === 0 && !isLoading && (
                  <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                    {isOver ? 'Drop here' : 'No tasks'}
                  </div>
                )}
              </>
            )}
            
            {canModify && (
              <Card className="border-dashed border-2 border-gray-200 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all cursor-pointer group">
                <CardContent className="p-3">
                  <Button variant="ghost" className="w-full h-10 text-muted-foreground group-hover:text-[var(--primary)]" onClick={onAddTask}>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
