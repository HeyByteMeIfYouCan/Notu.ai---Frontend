"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconCalendar, IconUser, IconClock, IconCheck, IconDots, IconDownload, IconShare2, IconLink, IconPencil } from "@tabler/icons-react"
import * as React from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import * as Dialog from "@radix-ui/react-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge as UIBadge } from "@/components/ui/badge"
import { IconPlus as PlusIcon } from "@tabler/icons-react"

type Task = {
  id: string
  title: string
  description: string
  assignee: string
  dueDate?: string
  tags?: string[]
  labelIds?: string[]
  progress?: number
  completedDate?: string
}

type ColumnId = "todo" | "in-progress" | "done"

export default function TodolistDetailPage() {
  const initialTodo: Task[] = [
    {
      id: "1",
      title: "Review Q4 performance metrics",
      description: "Analyze quarterly results and prepare summary report",
      assignee: "Sarah Wilson",
      dueDate: "Dec 25, 2024",
      tags: ["Analytics", "Reporting"]
    },
    {
      id: "2",
      title: "Update project documentation",
      description: "Revise technical specifications and user guides",
      assignee: "Mike Johnson",
      dueDate: "Dec 28, 2024",
      tags: ["Documentation"]
    },
    {
      id: "3",
      title: "Plan team building event",
      description: "Organize quarterly team activity and send invitations",
      assignee: "Emily Davis",
      dueDate: "Jan 5, 2025",
      tags: ["HR", "Planning"]
    },
    {
      id: "4",
      title: "Conduct user research interviews",
      description: "Schedule and conduct 5 user interviews for product feedback",
      assignee: "David Brown",
      dueDate: "Dec 30, 2024",
      tags: ["Research", "UX"]
    }
  ]

  const initialInProgress: Task[] = [
    {
      id: "5",
      title: "Implement new dashboard features",
      description: "Add analytics widgets and improve data visualization",
      assignee: "John Doe",
      dueDate: "Dec 22, 2024",
      tags: ["Development", "Frontend"],
      progress: 65
    },
    {
      id: "6",
      title: "Design mobile app interface",
      description: "Create wireframes and mockups for mobile version",
      assignee: "Lisa Chen",
      dueDate: "Dec 26, 2024",
      tags: ["Design", "Mobile"],
      progress: 40
    },
    {
      id: "7",
      title: "Write API documentation",
      description: "Document all endpoints and provide code examples",
      assignee: "Alex Rodriguez",
      dueDate: "Dec 24, 2024",
      tags: ["API", "Documentation"],
      progress: 80
    }
  ]

  const initialDone: Task[] = [
    {
      id: "8",
      title: "Setup CI/CD pipeline",
      description: "Configure automated testing and deployment",
      assignee: "Tom Wilson",
      dueDate: "Dec 20, 2024",
      tags: ["DevOps", "CI/CD"],
      completedDate: "Dec 18, 2024"
    },
    {
      id: "9",
      title: "Conduct security audit",
      description: "Review codebase for security vulnerabilities",
      assignee: "Security Team",
      dueDate: "Dec 15, 2024",
      tags: ["Security", "Audit"],
      completedDate: "Dec 14, 2024"
    },
    {
      id: "10",
      title: "Update privacy policy",
      description: "Revise privacy policy to comply with new regulations",
      assignee: "Legal Team",
      dueDate: "Dec 12, 2024",
      tags: ["Legal", "Compliance"],
      completedDate: "Dec 10, 2024"
    },
    {
      id: "11",
      title: "Optimize database queries",
      description: "Improve performance of slow database operations",
      assignee: "Database Team",
      dueDate: "Dec 10, 2024",
      tags: ["Database", "Performance"],
      completedDate: "Dec 8, 2024"
    }
  ]

  const [columns, setColumns] = React.useState<Record<ColumnId, Task[]>>({
    todo: initialTodo,
    'in-progress': initialInProgress,
    done: initialDone,
  })

  // Avoid hydration mismatch by rendering DnD subtree only on client
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Members invited to the project (demo data)
  const invitedMembers = React.useMemo(() => [
    "John Doe",
    "Sarah Wilson",
    "Mike Johnson",
    "Emily Davis",
    "Alex Rodriguez",
  ], [])

  // Labels like Trello
  type BoardLabel = { id: string; name: string; color: string }
  const [labels, setLabels] = React.useState<BoardLabel[]>([
    { id: "lbl-1", name: "FRONTEND", color: "#00F0C8" },
    { id: "lbl-2", name: "BACKEND", color: "#9B26F0" },
    { id: "lbl-3", name: "UI/UX", color: "#28C2FF" },
  ])
  const randomLabelColor = React.useCallback(() => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue} 90% 55%)`
  }, [])

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
)

  // Priority removed in design; helpers kept stubbed for compatibility if needed in future

  const TaskCard = ({ task, showProgress = false, className = "" }: { task: Task, showProgress?: boolean, className?: string }) => (
    <Card className={`mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing md:mb-4 ${className}`} onClick={() => openEdit(task)}>
      <CardContent className="p-3 md:p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm md:text-base">{task.title}</h3>
          </div>
          
          <p className="text-xs md:text-sm text-muted-foreground">{task.description}</p>
          
          {showProgress && task.progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                <div 
                  className="bg-blue-600 h-1.5 md:h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1">
            {(task.labelIds || []).map((id) => {
              const l = labels.find((x) => x.id === id)
              if (!l) return null
              return (
                <Badge key={id} variant="secondary" className="text-xs" style={{ backgroundColor: l.color, color: "white" }}>
                  {l.name}
                </Badge>
              )
            })}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <IconUser className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconCalendar className="h-3 w-3" />
              <span>{task.dueDate}</span>
            </div>
          </div>
          
          {task.completedDate && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <IconCheck className="h-3 w-3" />
              <span>Completed: {task.completedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const SortableCard = ({ task, showProgress }: { task: Task; showProgress?: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: task.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
    }
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <TaskCard 
          task={task} 
          showProgress={showProgress}
          className={isDragging ? 'bg-accent/10 border-2 border-accent opacity-30' : ''}
        />
      </div>
    )
  }

  const activeTaskRef = React.useRef<Task | null>(null)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const onDragStart = (activeId: string) => {
    const task = Object.values(columns).flat().find((t) => t.id === activeId) || null
    activeTaskRef.current = task
    setActiveId(activeId)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    // find source and destination
    let sourceColumn: ColumnId | null = null
    let destColumn: ColumnId | null = null
    ;(Object.keys(columns) as ColumnId[]).forEach((colId) => {
      if (columns[colId].some((t) => t.id === String(active.id))) sourceColumn = colId
      if (columns[colId].some((t) => t.id === String(over.id))) destColumn = colId
    })

    // If dropped over a column container itself
    if (!destColumn && (over.id === "todo" || over.id === "in-progress" || over.id === "done")) {
      destColumn = over.id as ColumnId
    }

    if (!sourceColumn || !destColumn) return

    const sourceItems: Task[] = [...columns[sourceColumn]]
    const destItems: Task[] = sourceColumn === destColumn ? sourceItems : [...columns[destColumn]]

    const fromIndex = sourceItems.findIndex((t) => t.id === String(active.id))
    const [moved] = sourceItems.splice(fromIndex, 1)
    const overIndex = destItems.findIndex((t) => t.id === String(over.id))
    const toIndex = overIndex >= 0 ? overIndex : destItems.length
    destItems.splice(toIndex, 0, moved)

    setColumns((prev) => ({
      ...prev,
      [sourceColumn!]: sourceColumn === destColumn ? destItems : sourceItems,
      [destColumn!]: destItems,
    }))
    setActiveId(null)
  }

  // Live reordering across columns for Trello-like smoothness
  const onDragOver = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    let from: ColumnId | null = null
    let to: ColumnId | null = null
    ;(Object.keys(columns) as ColumnId[]).forEach((c) => {
      if (columns[c].some((t) => t.id === activeIdStr)) from = c
      if (columns[c].some((t) => t.id === overIdStr)) to = c
    })
    if (!from) return
    if (!to && (overIdStr === "todo" || overIdStr === "in-progress" || overIdStr === "done")) to = overIdStr as ColumnId
    if (!to) return

    if (from === to) {
      const items: Task[] = [...columns[from]]
      const oldIndex = items.findIndex((t) => t.id === activeIdStr)
      const newIndex = items.findIndex((t) => t.id === overIdStr)
      if (newIndex === -1 || oldIndex === newIndex) return
      setColumns((prev) => ({ ...prev, [from!]: arrayMove(items, oldIndex, newIndex) }))
      return
    }

    // move across columns
    const fromItems: Task[] = [...columns[from]]
    const toItems: Task[] = [...columns[to]]
    const fromIndex = fromItems.findIndex((t) => t.id === activeIdStr)
    const [moved] = fromItems.splice(fromIndex, 1)
    const overIndex = toItems.findIndex((t) => t.id === overIdStr)
    const insertAt = overIndex >= 0 ? overIndex : toItems.length
    toItems.splice(insertAt, 0, moved)
    setColumns((prev) => ({ ...prev, [from!]: fromItems, [to!]: toItems }))
  }

  // Column droppable wrapper to allow dropping into empty areas
  const DroppableColumn = ({ id, children }: { id: ColumnId; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id })
    return (
      <div ref={setNodeRef} className={isOver ? "bg-purple-50/40 rounded-lg p-0.5 -m-0.5" : undefined}>
        {children}
      </div>
    )
  }

  // Add Task form state
  const [openAdd, setOpenAdd] = React.useState(false)
  const [newTask, setNewTask] = React.useState<Pick<Task, "title" | "description" | "assignee" | "dueDate" | "labelIds">>({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    labelIds: [],
  })

  const createTask = () => {
    const task: Task = {
      id: String(Date.now()),
      title: newTask.title || "New Task",
      description: newTask.description || "",
      assignee: newTask.assignee || "Unassigned",
      dueDate: newTask.dueDate,
      labelIds: newTask.labelIds || [],
    }
    setColumns((prev) => ({ ...prev, todo: [task, ...prev.todo] }))
    setOpenAdd(false)
    setNewTask({ title: "", description: "", assignee: "", dueDate: "", labelIds: [] })
  }

  // Edit modal state
  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | null>(null)
  const openEdit = (task: Task) => {
    setEditing(task)
    setEditOpen(true)
  }
  const saveEdit = () => {
    if (!editing) return
    const update = (items: Task[]) => items.map((t) => (t.id === editing.id ? editing : t))
    setColumns((prev) => ({
      todo: update(prev.todo),
      'in-progress': update(prev['in-progress']),
      done: update(prev.done),
    }))
    setEditOpen(false)
  }

  // Reusable form content
  const TaskForm = ({ state, setState }: { state: any; setState: (updater: any) => void }) => (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input onClick={(e) => e.stopPropagation()} id="title" value={state.title} onChange={(e) => setState((s: any) => ({ ...s, title: e.target.value }))} placeholder="Task title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <textarea id="desc" className="w-full rounded-md border bg-background p-2 text-sm" rows={4} value={state.description} onChange={(e) => setState((s: any) => ({ ...s, description: e.target.value }))} placeholder="Details" />
      </div>
      {/* Members / Labels / Due date row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Members */}
        <div className="space-y-2">
          <Label>Members</Label>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-[10px] font-semibold text-white ring-2 ring-background">
                {state.assignee?.split(" ").map((n: string) => n[0]).join("") || "?"}
              </div>
            </div>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <PlusIcon className="h-3.5 w-3.5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                  <Dialog.Title className="text-sm font-semibold">Members</Dialog.Title>
                  <div className="mt-3 space-y-2">
                    <Input onClick={(e) => e.stopPropagation()} placeholder="Search members" className="h-8 text-xs" />
                    <div className="space-y-1">
                      {invitedMembers.map((m) => (
                        <button key={m} type="button" className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-white`} onClick={() => setState((s: any) => ({ ...s, assignee: m }))}>
                          <span>{m}</span>
                          {state.assignee === m && <span className="text-xs">×</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-2">
          <Label>Labels</Label>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {(state.labelIds || []).map((id: string) => {
                const item = labels.find((l) => l.id === id)
                if (!item) return null
                return <UIBadge key={id} className="text-[11px]" style={{ backgroundColor: item.color, color: "white" }}>{item.name}</UIBadge>
              })}
            </div>
            {/* open existing labels dialog */}
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <PlusIcon className="h-3.5 w-3.5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                  <Dialog.Title className="text-sm font-semibold">Labels</Dialog.Title>
                  <div className="mt-3 space-y-2">
                    <Input onClick={(e) => e.stopPropagation()} placeholder="Search labels..." className="h-8 text-xs" />
                    <div className="space-y-2">
                      {labels.map((lbl) => {
                        const active = (state.labelIds || []).includes(lbl.id)
                        return (
                          <button key={lbl.id} type="button" onClick={() => setState((s: any) => {
                            const set = new Set<string>(s.labelIds || [])
                            active ? set.delete(lbl.id) : set.add(lbl.id)
                            return { ...s, labelIds: Array.from(set) }
                          })} className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs`} style={{ backgroundColor: lbl.color }}>
                            <span className="font-medium text-white">{lbl.name}</span>
                            <span className={`h-3 w-3 rounded-sm border ${active ? 'bg-black/70' : 'bg-white/50'}`}></span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input onClick={(e) => e.stopPropagation()} placeholder="New label name" className="h-8 text-xs" id="new-label-name" />
                      <Button className="h-8 px-3 text-xs" onClick={() => {
                        const input = document.getElementById('new-label-name') as HTMLInputElement | null
                        const name = input?.value?.trim()
                        if (!name) return
                        const newLbl: BoardLabel = { id: `lbl-${Date.now()}`, name, color: randomLabelColor() }
                        setLabels((prev) => [...prev, newLbl])
                        input!.value = ""
                      }}>Create</Button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Due date (single responsive input) */}
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input onClick={(e) => e.stopPropagation()} type="datetime-local" value={state.dueDate || ""} onChange={(e) => setState((s: any) => ({ ...s, dueDate: e.target.value }))} />
        </div>
      </div>
      {/* Description */}
    </div>
  )

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">Mobile App</h1>
                    <div className="flex items-center gap-2 text-[#6b4eff]">
                      <IconLink className="h-4 w-4" />
                      <IconPencil className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                      <IconDownload className="h-4 w-4" /> Download
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <IconShare2 className="h-4 w-4" /> Share
                    </Button>
                    <Dialog.Root open={openAdd} onOpenChange={setOpenAdd}>
                      <Dialog.Trigger asChild>
                        <Button className="gap-2">
                          <IconPlus className="h-4 w-4" /> Add Task
                        </Button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
                        <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
                          <Dialog.Title className="text-lg font-semibold">Add Task</Dialog.Title>
                          <TaskForm state={newTask} setState={setNewTask} />
                          <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                            <Button onClick={createTask}>Create</Button>
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                  </div>
                </div>
              </div>

              {/* Kanban Board */}
              <div className="px-4 lg:px-6">
                {!mounted ? (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 bg-[#f5f5f5] p-4 rounded-[6px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#6b4eff]"></span>
                            <h2 className="font-semibold text-lg">To Do</h2>
                            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{columns.todo.length}</Badge>
                          </div>
                          <IconDots className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 h-1 rounded bg-purple-200"></div>
                      </div>
                      <div className="space-y-3">
                        {columns.todo.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4 bg-[#f5f5f5] p-4 rounded-[6px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                            <h2 className="font-semibold text-lg">On Progress</h2>
                            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{columns['in-progress'].length}</Badge>
                          </div>
                          <IconDots className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 h-1 rounded bg-orange-300"></div>
                      </div>
                      <div className="space-y-3">
                        {columns['in-progress'].map((task: Task) => (
                          <TaskCard key={task.id} task={task} showProgress={true} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4 bg-[#f5f5f5] p-4 rounded-[6px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <h2 className="font-semibold text-lg">Done</h2>
                            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{columns.done.length}</Badge>
                          </div>
                          <IconDots className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 h-1 rounded bg-emerald-300"></div>
                      </div>
                      <div className="space-y-3">
                        {columns.done.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                <DndContext sensors={sensors} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragStart={({ active }) => onDragStart(String(active.id))} collisionDetection={closestCorners}>
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* To Do Column */}
                    <DroppableColumn id="todo">
                    <div className="space-y-4 bg-[#f5f5f5] p-4 rounded-[6px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#6b4eff]"></span>
                            <h2 className="font-semibold text-lg">To Do</h2>
                            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{columns.todo.length}</Badge>
                          </div>
                          <IconDots className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 h-1 rounded bg-purple-200"></div>
                      </div>
                      <SortableContext items={columns.todo.map((t) => t.id)} strategy={rectSortingStrategy}>
                        <div className="space-y-3">
                        {columns.todo.map((task) => (
                            <SortableCard key={task.id} task={task} />
                          ))}
                          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                            <CardContent className="p-4 text-center">
                              <Button variant="ghost" className="w-full h-12 text-muted-foreground">
                                <IconPlus className="h-4 w-4 mr-2" />
                                Add Task
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </SortableContext>
                    </div>
                    </DroppableColumn>

                    {/* In Progress Column */}
                    <DroppableColumn id="in-progress">
                    <div className="space-y-4 bg-[#f5f5f5] p-4 rounded-[6px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                            <h2 className="font-semibold text-lg">On Progress</h2>
                            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{columns['in-progress'].length}</Badge>
                          </div>
                          <IconDots className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 h-1 rounded bg-orange-300"></div>
                      </div>
                      <SortableContext items={columns['in-progress'].map((t: Task) => t.id)} strategy={rectSortingStrategy}>
                        <div className="space-y-3">
                        {columns['in-progress'].map((task: Task) => (
                            <SortableCard key={task.id} task={task} showProgress={true} />
                          ))}
                          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                            <CardContent className="p-4 text-center">
                              <Button variant="ghost" className="w-full h-12 text-muted-foreground">
                                <IconPlus className="h-4 w-4 mr-2" />
                                Add Task
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </SortableContext>
                    </div>
                    </DroppableColumn>

                    {/* Done Column */}
                    <DroppableColumn id="done">
                    <div className="space-y-4 bg-[#f5f5f5] p-4 rounded-[6px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <h2 className="font-semibold text-lg">Done</h2>
                            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{columns.done.length}</Badge>
                          </div>
                          <IconDots className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 h-1 rounded bg-emerald-300"></div>
                      </div>
                      <SortableContext items={columns.done.map((t) => t.id)} strategy={rectSortingStrategy}>
                        <div className="space-y-3">
                        {columns.done.map((task) => (
                            <SortableCard key={task.id} task={task} />
                          ))}
                          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                            <CardContent className="p-4 text-center">
                              <Button variant="ghost" className="w-full h-12 text-muted-foreground">
                                <IconPlus className="h-4 w-4 mr-2" />
                                Add Task
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </SortableContext>
                    </div>
                    </DroppableColumn>
                  </div>
                  <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>{activeTaskRef.current ? <div className="scale-[1.02] shadow-2xl"><TaskCard task={activeTaskRef.current} /></div> : null}</DragOverlay>
                </DndContext>
                )}
              </div>

              {/* Project Stats */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Statistics</CardTitle>
                    <CardDescription>Overview of task distribution and progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{columns.todo.length}</div>
                        <p className="text-sm text-muted-foreground">To Do</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{columns['in-progress'].length}</div>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{columns.done.length}</div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((columns.done.length / (columns.todo.length + columns['in-progress'].length + columns.done.length)) * 100)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Edit Task Modal */}
              <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/30" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold">Edit Task</Dialog.Title>
                    {editing && (
                      <TaskForm state={editing} setState={setEditing as any} />
                    )}
                    <div className="pt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                      <Button onClick={saveEdit}>Save</Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
