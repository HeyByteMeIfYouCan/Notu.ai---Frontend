import { 
  IconCalendar, 
  IconCheck, 
  IconAlertCircle,
  IconFlame,
  IconChevronUp,
  IconEqual,
  IconChevronDown
} from "@tabler/icons-react"
import { Task, BoardLabel } from "./types"
import { formatDueDate } from "@/lib/dateUtils"

interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
  labels?: BoardLabel[]
  members?: { id: string, name: string }[]
}

const priorityConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }> = {
  urgent: {
    label: "Urgent",
    icon: IconFlame,
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  high: {
    label: "High",
    icon: IconChevronUp,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  medium: {
    label: "Medium",
    icon: IconEqual,
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  low: {
    label: "Low",
    icon: IconChevronDown,
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
}

export function TaskCard({ task, onClick, labels = [], members = [] }: TaskCardProps) {
  const assigneeName = members.find(m => m.id === task.assignee)?.name || task.assignee || 'Unassigned'
  const assigneeInitial = assigneeName.charAt(0).toUpperCase()
  const dueString = task.dueDate ? formatDueDate(task.dueDate) : null
  const isOverdue = dueString === 'Late' || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done')
  const priorityInfo = task.priority ? priorityConfig[task.priority.toLowerCase()] : null
  const PriorityIcon = priorityInfo?.icon

  return (
    <div
      onClick={() => onClick?.(task)}
      className="group relative rounded-xl border border-border/60 bg-card text-card-foreground p-4 shadow-sm hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="space-y-3">
        {/* Top Header: Labels and Priority Indicator */}
        <div className="flex items-center justify-between gap-2 min-h-[22px]">
          {/* Labels */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {(task.labelIds || []).map((id) => {
              const l = labels.find((x) => x.id === id)
              if (!l) return null
              return (
                <span 
                  key={id} 
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center shadow-2xs text-white"
                  style={{ backgroundColor: l.color }}
                >
                  {l.name}
                </span>
              )
            })}
          </div>

          {/* Priority Pill */}
          {priorityInfo && PriorityIcon && (
            <span 
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${priorityInfo.badgeClass}`}
              title={`Priority: ${priorityInfo.label}`}
            >
              <PriorityIcon className="h-3 w-3" />
              <span>{priorityInfo.label}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug text-foreground/95 line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h3>
        
        {/* Description Snippet */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
        
        {/* Footer: Assignee, Due Date, Completed Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
          {/* Assignee */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-5 w-5 rounded-full bg-muted border border-border text-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
              {assigneeInitial}
            </div>
            <span className="truncate max-w-[110px] text-[11px] font-medium text-foreground/80">
              {assigneeName}
            </span>
          </div>

          {/* Due date or Completed */}
          <div className="flex items-center gap-1.5 shrink-0">
            {task.completedDate ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <IconCheck className="h-3 w-3" />
                <span>Selesai</span>
              </span>
            ) : dueString ? (
              <span 
                className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-md font-medium ${
                  isOverdue 
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                    : 'bg-muted/50 text-muted-foreground border border-border/40'
                }`}
              >
                {isOverdue ? <IconAlertCircle className="h-3 w-3 text-rose-500" /> : <IconCalendar className="h-3 w-3 text-muted-foreground" />}
                <span>{dueString}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
