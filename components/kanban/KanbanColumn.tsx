import { useDroppable } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconDots, IconPlus } from "@tabler/icons-react"
import { Task, ColumnId, BoardLabel } from "./types"
import { TaskCard } from "./TaskCard"

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
}

function SortableTaskCard({ task, labels, onClick, showProgress, members }: { task: Task; labels: BoardLabel[]; onClick: (t: Task) => void; showProgress?: boolean; members?: { id: string, name: string }[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} showProgress={showProgress} onClick={onClick} labels={labels} members={members} />
    </div>
  )
}

export function KanbanColumn({ id, title, tasks, color, bgLight, bgDark, labels, onAddTask, onEditTask, members, canModify = true }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const showProgress = id === 'in-progress'

  return (
    <div ref={setNodeRef} className={isOver ? "bg-purple-50/40 rounded-lg p-0.5 -m-0.5" : undefined}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full`} style={{ backgroundColor: color }}></span>
              <h2 className="font-semibold text-lg">{title}</h2>
              <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{tasks.length}</Badge>
            </div>
            <IconDots className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={`mt-3 h-1 rounded`} style={{ backgroundColor: bgDark }}></div>
        </div>

        {/* Tasks List */}
        <SortableContext items={tasks.filter(Boolean).map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className="space-y-3">
            {tasks.filter(Boolean).map((task) => (
              <SortableTaskCard 
                key={task.id} 
                task={task} 
                labels={labels}
                onClick={onEditTask} 
                showProgress={showProgress} 
                members={members}
              />
            ))}
            
            {canModify && (
              <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                <CardContent className="p-4 text-center">
                  <Button variant="ghost" className="w-full h-12 text-muted-foreground" onClick={onAddTask}>
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
