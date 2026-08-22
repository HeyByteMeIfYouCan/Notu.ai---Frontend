import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconCalendar, IconUser, IconCheck, IconClock } from "@tabler/icons-react"
import { Task, BoardLabel } from "./types"
import { formatDueDate } from "@/lib/dateUtils"

interface TaskCardProps {
  task: Task
  showProgress?: boolean
  onClick?: (task: Task) => void
  labels?: BoardLabel[]
  members?: { id: string, name: string }[]
}

export function TaskCard({ task, showProgress = false, onClick, labels = [], members = [] }: TaskCardProps) {
  const assigneeName = members.find(m => m.id === task.assignee)?.name || task.assignee || 'Unassigned'
  const dueString = task.dueDate ? formatDueDate(task.dueDate) : null
  const isOverdue = dueString === 'Late' || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done')
  
  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 bg-white ${
        isOverdue ? 'border-l-red-400' : 
        task.priority === 'urgent' ? 'border-l-red-400' :
        task.priority === 'high' ? 'border-l-orange-400' :
        'border-l-transparent'
      }`}
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-3 md:p-4">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm md:text-base leading-tight line-clamp-2">{task.title}</h3>
            {task.priority && (
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 h-5 capitalize shrink-0 ${
                  task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                  task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                  task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {task.priority}
              </Badge>
            )}
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          
          {showProgress && task.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {(task.labelIds?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {(task.labelIds || []).map((id) => {
                const l = labels.find((x) => x.id === id)
                if (!l) return null
                return (
                  <Badge key={id} variant="secondary" className="text-[10px] px-1.5 py-0" style={{ backgroundColor: l.color, color: "white" }}>
                    {l.name}
                  </Badge>
                )
              })}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <IconUser className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{assigneeName}</span>
            </div>
            {dueString && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                {isOverdue ? <IconClock className="h-3 w-3" /> : <IconCalendar className="h-3 w-3" />}
                <span>{dueString}</span>
              </div>
            )}
          </div>
          
          {task.completedDate && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded px-2 py-1 w-fit">
              <IconCheck className="h-3 w-3" />
              <span>Completed {task.completedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
