"use client"

import * as React from "react"
import { useCallback, useEffect, useState, useRef, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  UniqueIdentifier,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { 
  IconPlus, 
  IconDownload, 
  IconShare2, 
  IconPencil, 
  IconCopy, 
  IconArrowLeft, 
  IconSearch, 
  IconListCheck, 
  IconClockPlay, 
  IconCircleCheck, 
  IconLayoutBoard, 
  IconChartBar, 
  IconFileSpreadsheet, 
  IconCode, 
  IconX,
  IconCheck,
  IconDotsVertical,
  IconCrown,
  IconEye
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { useApiWithAuth, useAuth } from "@/hooks/use-auth"
import { Task, ColumnId, BoardLabel, TaskStatus } from "./types"
import { KanbanColumn } from "./KanbanColumn"
import { TaskCard } from "./TaskCard"
import { TaskForm } from "./TaskForm"
import { getSocket } from "@/lib/socket"
import { Input } from "@/components/ui/input"
import { OnlinePresence } from "@/components/custom/OnlinePresence"
import { getPermissions, getAssignableRoles, getRoleLabel } from "@/lib/permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const columnToStatus: Record<ColumnId, TaskStatus> = {
  'todo': 'todo',
  'in-progress': 'in-progress',
  'done': 'done'
}

function RoleBadge({ role }: { role: string }) {
  const roleLower = (role || 'viewer').toLowerCase()
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    editor: 'Editor',
    admin: 'Admin',
    viewer: 'Viewer'
  }
  const label = roleLabels[roleLower] || roleLower
  
  return (
    <span className="text-[11px] font-medium tracking-tight text-muted-foreground bg-muted/50 border border-border/70 px-2 py-0.5 rounded-md">
      {label}
    </span>
  )
}

export function KanbanBoard({ boardId }: { boardId?: string }) {
  const router = useRouter()
  const { api, isReady } = useApiWithAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [columns, setColumns] = useState<Record<ColumnId, Task[]>>({
    todo: [],
    'in-progress': [],
    done: [],
  })

  const [board, setBoard] = useState<{ 
    title: string; 
    description?: string; 
    userRole?: string;
    collaborators?: any[];
    shareToken?: string;
    userId?: any;
    labels?: BoardLabel[];
  } | null>(null)

  const { user } = useAuth()
  const [showShare, setShowShare] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Labels
  const [labels, setLabels] = useState<BoardLabel[]>([])

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const labelsRef = useRef<BoardLabel[]>([])
  useEffect(() => {
    labelsRef.current = labels
  }, [labels])

  // Fetch Board info
  const fetchBoardInfo = useCallback(async () => {
    if (!isReady || !boardId) return
    try {
      const response = await api.getBoard(boardId)
      const data = (response as any).data || response
      setBoard(data)
      if (data.labels) {
        const mappedLabels = data.labels.map((l: any) => ({ ...l, id: l._id || l.id }))
        setLabels(mappedLabels)
        labelsRef.current = mappedLabels
      }
    } catch (error) {
      console.error("Error fetching board info:", error)
    }
  }, [isReady, boardId, api])

  useEffect(() => {
    if (isReady && boardId) fetchBoardInfo()
  }, [isReady, boardId, fetchBoardInfo])

  // Members derived from board collaborators
  const boardMembers = useMemo(() => {
    if (!board) return []
    const members = []
    if (board.userId) {
      members.push({ id: (board.userId as any)._id || board.userId, name: (board.userId as any).name || 'Owner' })
    }
    if (board.collaborators) {
      board.collaborators.forEach((c: any) => {
        if (c.user) {
          members.push({ id: c.user._id || c.user, name: c.user.name || 'Member' })
        }
      })
    }
    return Array.from(new Map(members.map(m => [m.id, m])).values())
  }, [board])

  const role = board?.userRole ?? 'viewer'
  const permissions = useMemo(() => getPermissions(role), [role])
  const assignableRoles = useMemo(() => getAssignableRoles(role), [role])

  const handleCreateLabel = async (newLabel: Omit<BoardLabel, "id">) => {
    if (!boardId || !board) return
    try {
      const updatedLabelsArray = [...(board.labels || []), newLabel]
      const response = await api.updateBoard(boardId, { labels: updatedLabelsArray })
      const updatedBoard = (response as any).data || response
      setBoard(updatedBoard)
      if (updatedBoard.labels) {
        const mappedLabels = updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id }))
        setLabels(mappedLabels)
        labelsRef.current = mappedLabels
      }
      toast.success("Label berhasil dibuat")
    } catch (error) {
      toast.error("Gagal membuat label")
    }
  }

  const handleUpdateLabel = async (id: string, updates: Partial<BoardLabel>) => {
    if (!boardId || !board) return
    try {
      const updatedLabelsArray = (board.labels || []).map((l: any) => 
        (l._id === id || l.id === id) ? { ...l, ...updates } : l
      )
      const response = await api.updateBoard(boardId, { labels: updatedLabelsArray })
      const updatedBoard = (response as any).data || response
      setBoard(updatedBoard)
      if (updatedBoard.labels) {
        const mappedLabels = updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id }))
        setLabels(mappedLabels)
        labelsRef.current = mappedLabels
      }
      fetchTasks()
      toast.success("Label berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui label")
    }
  }

  const handleDeleteLabel = async (id: string) => {
    if (!boardId || !board) return
    try {
      const updatedLabelsArray = (board.labels || []).filter((l: any) => l._id !== id && l.id !== id)
      const response = await api.updateBoard(boardId, { labels: updatedLabelsArray })
      const updatedBoard = (response as any).data || response
      setBoard(updatedBoard)
      if (updatedBoard.labels) {
        const mappedLabels = updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id }))
        setLabels(mappedLabels)
        labelsRef.current = mappedLabels
      }
      fetchTasks()
      toast.success("Label dihapus")
    } catch (error) {
      toast.error("Gagal menghapus label")
    }
  }

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    if (!isReady) return
    try {
      setIsLoading(true)
      const response = await api.getKanbanTasks(boardId)
      const rawData = (response as any).kanban || response.data || {}

      const transformTask = (task: any): Task => {
        const labelsFromBackend = task.labels || task.tags || []
        const labelIds = labelsFromBackend.map((name: string) => 
          labelsRef.current.find(l => l.name === name)?.id
        ).filter(Boolean)

        return {
          id: task._id,
          _id: task._id,
          title: task.title,
          description: task.description || '',
          assignee: typeof task.assignee === 'object' ? task.assignee?._id : (task.assignee || null),
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          labels: labelsFromBackend,
          status: task.status,
          priority: task.priority || 'medium',
          order: task.order,
          labelIds: labelIds,
          progress: task.progress !== undefined ? task.progress : (task.status === 'in-progress' ? 50 : undefined),
          completedDate: task.status === 'done' && task.updatedAt ? 
            new Date(task.updatedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : undefined
        }
      }

      setColumns({
        todo: (rawData.todo || []).map(transformTask),
        'in-progress': (rawData['in-progress'] || []).map(transformTask),
        done: (rawData.done || []).map(transformTask),
      })
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Gagal memuat task board")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api, boardId])

  useEffect(() => {
    if (isReady && boardId && board) {
      fetchTasks()
    }
  }, [isReady, boardId, board, fetchTasks])

  const userIdRef = useRef<string | null>(null)
  useEffect(() => {
    userIdRef.current = (user as any)?.id || (user as any)?._id || null
  }, [user])

  // Socket.io Integration
  useEffect(() => {
    if (!boardId || !mounted) return

    const socket = getSocket()
    socket.emit('join_board', boardId)

    const handleTaskCreated = ({ task, userName, taskTitle, userId }: any) => {
      if (userId && userId === userIdRef.current) return
      toast.info(`${userName || 'Seseorang'} telah membuat task "${taskTitle || task?.title || 'Baru'}"`)
      fetchTasks()
    }

    const handleTaskUpdated = ({ task, userName, taskTitle, userId }: any) => {
      if (userId && userId === userIdRef.current) return
      toast.info(`${userName || 'Seseorang'} telah memperbarui task "${taskTitle || task?.title || 'Tugas'}"`)
      fetchTasks()
    }

    const handleTaskDeleted = ({ taskId, userName, taskTitle, userId }: any) => {
      if (userId && userId === userIdRef.current) return
      toast.info(`${userName || 'Seseorang'} telah menghapus task "${taskTitle || 'Tugas'}"`)
      fetchTasks()
    }

    const handleTasksReordered = ({ tasks, userName, userId }: any) => {
      if (userId && userId === userIdRef.current) return
      fetchTasks()
    }

    const handleBoardUpdated = ({ board: updatedBoard, userName, userId }: any) => {
      if (userId && userId === userIdRef.current) return
      toast.info(`${userName || 'Seseorang'} telah memperbarui board`)
      setBoard(updatedBoard)
      if (updatedBoard.labels) {
        const mappedLabels = updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id }))
        setLabels(mappedLabels)
        labelsRef.current = mappedLabels
      }
      fetchTasks()
    }

    socket.on('task_created', handleTaskCreated)
    socket.on('task_updated', handleTaskUpdated)
    socket.on('task_deleted', handleTaskDeleted)
    socket.on('tasks_reordered', handleTasksReordered)
    socket.on('board_updated', handleBoardUpdated)

    return () => {
      socket.emit('leave_board', boardId)
      socket.off('task_created', handleTaskCreated)
      socket.off('task_updated', handleTaskUpdated)
      socket.off('task_deleted', handleTaskDeleted)
      socket.off('tasks_reordered', handleTasksReordered)
      socket.off('board_updated', handleBoardUpdated)
    }
  }, [boardId, mounted, fetchTasks])

  const handleGenerateShare = async () => {
    if (!isReady || !boardId) return
    try {
      const res = await api.generateBoardShareLink(boardId)
      setShareToken(res.data.shareToken)
    } catch (error) {
      toast.error("Gagal generate link berbagi")
    }
  }

  const canModify = permissions.canEditTasks
  const isOwner = permissions.canDelete

  // Title Editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState("")

  const handleUpdateTitle = async () => {
    if (!boardId || !tempTitle.trim()) return
    try {
      await api.updateBoard(boardId, { title: tempTitle.trim() })
      setBoard(prev => prev ? { ...prev, title: tempTitle.trim() } : null)
      setEditingTitle(false)
      toast.success("Judul board diperbarui")
    } catch (e) {
      toast.error("Gagal memperbarui judul")
    }
  }

  // Export feature
  const handleExport = (format: 'json' | 'csv') => {
    const allTasks = [
      ...columns.todo.map(t => ({ ...t, statusLabel: 'To Do' })),
      ...columns['in-progress'].map(t => ({ ...t, statusLabel: 'In Progress' })),
      ...columns.done.map(t => ({ ...t, statusLabel: 'Completed' })),
    ]

    const filename = `${board?.title || 'kanban-board'}`.toLowerCase().replace(/[^a-z0-9]/g, '_')

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ 
        board: { title: board?.title, description: board?.description }, 
        exportedAt: new Date().toISOString(),
        tasks: allTasks 
      }, null, 2))
      const dlAnchor = document.createElement('a')
      dlAnchor.setAttribute("href", dataStr)
      dlAnchor.setAttribute("download", `${filename}.json`)
      dlAnchor.click()
    } else {
      const headers = ["ID", "Title", "Status", "Priority", "Assignee", "Due Date", "Description"]
      const rows = allTasks.map(t => [
        `"${t.id || ''}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.statusLabel}"`,
        `"${t.priority || 'medium'}"`,
        `"${(boardMembers.find(m => m.id === t.assignee)?.name || t.assignee || '').replace(/"/g, '""')}"`,
        `"${t.dueDate || ''}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
      ])
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `${filename}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    toast.success(`Board berhasil diexport (${format.toUpperCase()})`)
  }

  // DnD logic
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const activeTaskRef = useRef<Task | null>(null)
  const startColumnRef = useRef<ColumnId | null>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const findColumnByTaskId = (taskId: string): ColumnId | null => {
    for (const colId of Object.keys(columns) as ColumnId[]) {
      if (columns[colId].some((t) => t.id === taskId)) return colId
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!canModify) return
    const { active } = event
    const activeIdStr = String(active.id)
    
    const sourceCol = findColumnByTaskId(activeIdStr)
    const task = Object.values(columns).flat().find((t) => t.id === activeIdStr) || null

    startColumnRef.current = sourceCol
    activeTaskRef.current = task
    setActiveId(active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    
    const activeCol = findColumnByTaskId(activeIdStr)
    let overCol = findColumnByTaskId(overIdStr)
    
    if (!overCol && (overIdStr === "todo" || overIdStr === "in-progress" || overIdStr === "done")) {
      overCol = overIdStr as ColumnId
    }
    
    if (!activeCol || !overCol || activeCol === overCol) return
    
    setColumns(prev => {
      const sourceList = [...prev[activeCol]]
      const targetList = [...prev[overCol]]
      
      const activeIdx = sourceList.findIndex(t => t.id === activeIdStr)
      if (activeIdx === -1) return prev
      
      const [movedTask] = sourceList.splice(activeIdx, 1)
      const targetStatus = columnToStatus[overCol]
      const updatedMovedTask: Task = { 
        ...movedTask, 
        status: targetStatus,
        completedDate: targetStatus === 'done' ? new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : undefined,
        progress: targetStatus === 'in-progress' ? (movedTask.progress ?? 50) : undefined,
      }
      
      const overIdx = targetList.findIndex(t => t.id === overIdStr)
      if (overIdx >= 0) {
        targetList.splice(overIdx, 0, updatedMovedTask)
      } else {
        targetList.push(updatedMovedTask)
      }
      
      return {
        ...prev,
        [activeCol]: sourceList,
        [overCol]: targetList
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event
    const activeTask = activeTaskRef.current
    const startCol = startColumnRef.current
    
    setActiveId(null)
    activeTaskRef.current = null
    startColumnRef.current = null
    
    if (!canModify || !activeTask || !startCol) return

    const activeIdStr = String(active.id)
    const overIdStr = over ? String(over.id) : null

    // Determine final column where the task is currently sitting
    let finalCol = findColumnByTaskId(activeIdStr)
    if (!finalCol && overIdStr) {
      finalCol = findColumnByTaskId(overIdStr)
    }
    if (!finalCol && overIdStr && (overIdStr === "todo" || overIdStr === "in-progress" || overIdStr === "done")) {
      finalCol = overIdStr as ColumnId
    }

    if (!finalCol) return

    const finalStatus: TaskStatus = columnToStatus[finalCol]

    // If within same column, handle reordering if needed
    if (overIdStr && startCol === finalCol) {
      const colTasks = columns[finalCol]
      const oldIndex = colTasks.findIndex((t) => t.id === activeIdStr)
      const newIndex = colTasks.findIndex((t) => t.id === overIdStr)
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(colTasks, oldIndex, newIndex)
        setColumns(prev => ({ ...prev, [finalCol]: reordered }))
        
        try {
          const taskOrders = reordered.map((t, idx) => ({ 
            id: t.id, 
            order: idx, 
            status: finalStatus 
          }))
          await api.reorderTasks(taskOrders, boardId)
        } catch (e) {
          console.error("Reorder failed:", e)
          fetchTasks()
        }
        return
      }
    }

    // Persist status and order to backend
    try {
      if (startCol !== finalCol || activeTask.status !== finalStatus) {
        await api.updateTask(activeIdStr, { 
          status: finalStatus,
          boardId: boardId 
        })
      }

      const tasksToReorder: { id: string; order: number; status: TaskStatus }[] = []
      
      // Reorder final column
      columns[finalCol]?.forEach((t, idx) => {
        tasksToReorder.push({
          id: t.id,
          order: idx,
          status: finalStatus
        })
      })

      // Reorder start column if changed
      if (startCol !== finalCol && columns[startCol]) {
        const startStatus = columnToStatus[startCol]
        columns[startCol].forEach((t, idx) => {
          tasksToReorder.push({
            id: t.id,
            order: idx,
            status: startStatus
          })
        })
      }

      if (tasksToReorder.length > 0) {
        await api.reorderTasks(tasksToReorder, boardId)
      }
    } catch (e) {
      console.error("Failed to update task position:", e)
      toast.error("Gagal menyimpan perubahan posisi task")
      fetchTasks()
    }
  }

  // Create Task state
  const [openAdd, setOpenAdd] = useState(false)
  const [targetColumnForAdd, setTargetColumnForAdd] = useState<ColumnId>("todo")
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    assignee: string | null;
    dueDate: string | null;
    priority: string;
    labelIds: string[];
  }>({
    title: "",
    description: "",
    assignee: null,
    dueDate: null,
    priority: "medium",
    labelIds: [],
  })

  const openAddTaskModal = (colId: ColumnId = "todo") => {
    setTargetColumnForAdd(colId)
    setNewTask({
      title: "",
      description: "",
      assignee: null,
      dueDate: null,
      priority: "medium",
      labelIds: [],
    })
    setOpenAdd(true)
  }

  const createTask = async () => {
    if (!isReady || !newTask.title.trim()) {
      toast.error("Judul task harus diisi")
      return
    }
    try {
      setIsSaving(true)
      const selectedLabels = newTask.labelIds.map(id => labels.find(l => l.id === id)?.name || '').filter(Boolean)
      
      await api.createTask({
        title: newTask.title.trim(),
        description: newTask.description,
        boardId: boardId,
        status: columnToStatus[targetColumnForAdd],
        assignee: newTask.assignee,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        labels: selectedLabels,
      })
      
      setOpenAdd(false)
      setNewTask({
        title: "",
        description: "",
        assignee: null,
        dueDate: null,
        priority: "medium",
        labelIds: [],
      })
      fetchTasks()
      toast.success("Task berhasil dibuat")
    } catch (e) {
      toast.error("Gagal membuat task")
    } finally {
      setIsSaving(false)
    }
  }

  // Edit Task state
  const [editing, setEditing] = useState<Task | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const originalEditingTaskRef = useRef<Task | null>(null)

  const openEdit = (task: Task) => {
    const taskWithLabels = {
      ...task,
      labelIds: task.labelIds || task.labels?.map((name: string) => labels.find(l => l.name === name)?.id).filter((id): id is string => Boolean(id)) || [],
    }
    originalEditingTaskRef.current = taskWithLabels
    setEditing(taskWithLabels)
    setEditOpen(true)
  }

  // Auto-save logic
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  useEffect(() => {
    if (!editOpen || !editing || !editing._id || !canModify) return;

    const taskId = editing._id;
    
    const original = originalEditingTaskRef.current;
    if (!original) return;

    const hasChanged = 
      editing.title !== original.title ||
      editing.description !== original.description ||
      editing.assignee !== original.assignee ||
      editing.dueDate !== original.dueDate ||
      editing.priority !== original.priority ||
      JSON.stringify(editing.labelIds || []) !== JSON.stringify(original.labelIds || []);

    if (!hasChanged) return;

    setIsAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        const selectedLabels = editing.labelIds?.map(id => labels.find(l => l.id === id)?.name || '').filter(Boolean) || editing.labels;
        
        await api.updateTask(taskId, {
          title: editing.title,
          description: editing.description,
          assignee: editing.assignee,
          dueDate: editing.dueDate,
          priority: editing.priority,
          labels: selectedLabels,
        });

        originalEditingTaskRef.current = { ...editing };
        fetchTasks();
      } catch (e) {
        console.error("Auto-save failed", e);
      } finally {
        setTimeout(() => setIsAutoSaving(false), 500); // give a little time to show the saved state
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [editing, editOpen, canModify, labels, fetchTasks]);

  const saveEdit = async () => {
    // Kept for manual trigger if needed, though auto-save takes over mostly
    setEditOpen(false)
  }

  const deleteTask = async (taskId: string) => {
    if (!isReady) return
    setEditOpen(false)
    try {
      await api.deleteTask(taskId)
      fetchTasks()
      toast.success("Task dihapus")
    } catch (e) {
      toast.error("Gagal menghapus task")
    }
  }

  // Live filter tasks across columns
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns
    const q = searchQuery.toLowerCase().trim()
    
    const filterList = (tasks: Task[]) => {
      return tasks.filter(t => {
        const titleMatch = t.title?.toLowerCase().includes(q)
        const descMatch = t.description?.toLowerCase().includes(q)
        const assigneeMatch = boardMembers.find(m => m.id === t.assignee)?.name?.toLowerCase().includes(q)
        const labelMatch = (t.labels || []).some(l => l.toLowerCase().includes(q))
        const priorityMatch = t.priority?.toLowerCase().includes(q)
        return titleMatch || descMatch || assigneeMatch || labelMatch || priorityMatch
      })
    }

    return {
      todo: filterList(columns.todo),
      'in-progress': filterList(columns['in-progress']),
      done: filterList(columns.done),
    }
  }, [columns, searchQuery, boardMembers])

  // Statistics calculation
  const totalTasks = columns.todo.length + columns['in-progress'].length + columns.done.length
  const todoCount = columns.todo.length
  const inProgressCount = columns['in-progress'].length
  const doneCount = columns.done.length

  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  const todoPercent = totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0
  const inProgressPercent = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0
  const donePercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Memuat Kanban Board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50/40 dark:bg-zinc-950/40">
      <div className="flex flex-col gap-5 py-5 sm:gap-6 sm:py-6 h-full">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="px-4 lg:px-6 space-y-3">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <button 
              onClick={() => router.push('/dashboard/kanban')}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors group"
            >
              <IconLayoutBoard className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span>Kanban</span>
            </button>
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-md">
              {board?.title || "Detail Board"}
            </span>
          </div>

          {/* Main Title & Action Buttons Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-border/40 pb-5">
            {/* Title & Role */}
            <div className="flex-1 min-w-0 pr-0 xl:pr-6">
              {editingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={tempTitle} 
                    onChange={(e) => setTempTitle(e.target.value)} 
                    className="text-xl sm:text-2xl font-bold h-10 w-full max-w-[400px] rounded-xl"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateTitle()
                      if (e.key === 'Escape') setEditingTitle(false)
                    }}
                  />
                  <Button size="sm" onClick={handleUpdateTitle} className="h-9 px-3 rounded-xl shadow-sm shrink-0">Simpan</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)} className="h-9 px-3 rounded-xl shrink-0">Batal</Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground line-clamp-2">
                    {board?.title || "Kanban Board"}
                  </h1>
                  <div className="flex items-center gap-2 shrink-0">
                    {canModify && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        onClick={() => {
                          setTempTitle(board?.title || "")
                          setEditingTitle(true)
                        }}
                        title="Edit judul board"
                      >
                        <IconPencil className="h-4 w-4" />
                      </Button>
                    )}
                    <RoleBadge role={role} />
                  </div>
                </div>
              )}
              {board?.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl line-clamp-2">
                  {board.description}
                </p>
              )}
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap mt-2 xl:mt-0">
              {/* Search filter input */}
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[140px] sm:w-[180px] pl-9 pr-8 text-sm rounded-xl bg-muted/40 border-border/60 hover:bg-muted/60 focus-visible:bg-transparent transition-all shadow-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="h-5 w-px bg-border/60 hidden sm:block"></div>

              {/* Online Presence Avatars */}
              {boardId && (
                <div className="hidden sm:block">
                  <OnlinePresence
                    resourceType="board"
                    resourceId={boardId}
                    currentUserId={(user as any)?.id || (user as any)?._id}
                    collaborators={board?.collaborators}
                    owner={board?.userId}
                    maxAvatars={3}
                  />
                </div>
              )}

              {/* Share Dialog */}
              {isOwner && (
                <Dialog.Root open={showShare} onOpenChange={setShowShare}>
                  <Dialog.Trigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group h-9 gap-1.5 rounded-xl border-border/70 text-xs font-semibold bg-background hover:bg-muted hover:text-foreground transition-all shadow-sm active:scale-[0.98]" 
                      onClick={handleGenerateShare}
                    >
                      <IconShare2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-[60] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
                      <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                        <IconShare2 className="h-4 w-4 text-primary" />
                        <span>Bagikan Board Kolaborasi</span>
                      </Dialog.Title>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground">Tautan Kolaborasi</label>
                          <div className="flex gap-2">
                            <Input 
                              readOnly 
                              value={shareToken ? `${window.location.origin}/dashboard/join/board/${shareToken}` : "Memuat tautan..."} 
                              className="h-10 text-xs rounded-xl bg-muted/40 font-mono focus-visible:ring-0 shadow-none border-border/60"
                            />
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-10 w-10 rounded-xl shrink-0 shadow-sm border-border/60 hover:bg-accent" 
                              onClick={() => {
                                if (shareToken) {
                                  navigator.clipboard.writeText(`${window.location.origin}/dashboard/join/board/${shareToken}`)
                                  setCopiedLink(true)
                                  setTimeout(() => setCopiedLink(false), 2000)
                                  toast.success("Tautan disalin ke clipboard")
                                }
                              }}
                            >
                              {copiedLink ? <IconCheck className="h-4 w-4 text-emerald-600" /> : <IconCopy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        {permissions.canManageCollaborators && (
                          <div className="pt-4 border-t border-border/60 space-y-3">
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">Kolaborator Terdaftar</h3>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                              {board?.collaborators?.map((col) => (
                                <div key={col.user._id} className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60 text-xs shadow-sm">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                      {col.user.name?.[0]?.toUpperCase() || 'M'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-foreground truncate">{col.user.name}</p>
                                      <select 
                                        className="text-[11px] font-medium bg-transparent border-none p-0 h-auto focus:ring-0 text-muted-foreground outline-none cursor-pointer hover:text-foreground"
                                        value={col.role}
                                        onChange={(e) => {
                                          api.updateBoardCollaboratorRole(boardId!, col.user._id, e.target.value).then(() => fetchBoardInfo())
                                        }}
                                      >
                                        {assignableRoles.map(r => (
                                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive hover:bg-destructive/10 h-8 text-xs font-medium rounded-lg px-2.5" 
                                    onClick={() => {
                                      if(boardId) api.removeBoardCollaborator(boardId, col.user._id).then(() => fetchBoardInfo())
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              ))}
                              {(!board?.collaborators || board.collaborators.length === 0) && (
                                <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-xl border border-dashed border-border/60">Belum ada anggota kolaborasi</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              )}

              {/* More Actions Dropdown (Export, etc.) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="group h-9 w-9 rounded-xl border-border/70 text-muted-foreground hover:text-foreground bg-background hover:bg-accent/80 hover:border-border transition-all shadow-sm active:scale-[0.98]"
                    title="Menu opsi lainnya"
                  >
                    <IconDotsVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl p-1.5 shadow-lg border border-border/60 min-w-[160px]">
                  <DropdownMenuItem onClick={() => handleExport('csv')} className="group text-[13px] font-medium gap-2.5 cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-accent">
                    <IconFileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Export CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="group text-[13px] font-medium gap-2.5 cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-accent">
                    <IconCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Export JSON</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Task Button */}
              {canModify && (
                <Button 
                  onClick={() => openAddTaskModal("todo")} 
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  <span>Tambah Task</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ================= KANBAN BOARD CANVAS ================= */}
        <div className="px-4 lg:px-6 flex-1 overflow-x-auto">
          <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
          >
            <div className="grid gap-5 md:grid-cols-3 h-full pb-4 min-w-[760px]">
              <KanbanColumn 
                id="todo" 
                title="To Do" 
                tasks={filteredColumns.todo} 
                color="#3b82f6"
                labels={labels}
                onAddTask={() => openAddTaskModal("todo")}
                onEditTask={openEdit}
                members={boardMembers}
                canModify={canModify}
                isLoading={isLoading}
              />
              <KanbanColumn 
                id="in-progress" 
                title="In Progress" 
                tasks={filteredColumns['in-progress']} 
                color="#f59e0b"
                labels={labels}
                onAddTask={() => openAddTaskModal("in-progress")}
                onEditTask={openEdit}
                members={boardMembers}
                canModify={canModify}
                isLoading={isLoading}
              />
              <KanbanColumn 
                id="done" 
                title="Selesai" 
                tasks={filteredColumns.done} 
                color="#10b981"
                labels={labels}
                onAddTask={() => openAddTaskModal("done")}
                onEditTask={openEdit}
                members={boardMembers}
                canModify={canModify}
                isLoading={isLoading}
              />
            </div>
            
            <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
              {activeId && activeTaskRef.current ? (
                <div className="scale-[1.03] shadow-2xl opacity-95 cursor-grabbing rotate-1 pointer-events-none">
                  <TaskCard 
                    task={activeTaskRef.current} 
                    labels={labels} 
                    members={boardMembers} 
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* ================= METRICS & STATS FOOTER ================= */}
        <div className="px-4 lg:px-6 py-4 mt-auto border-t border-border/40 bg-background/50 backdrop-blur-md sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[13px] font-medium text-muted-foreground flex-wrap">
            <span className="text-foreground font-semibold">{totalTasks} Tasks</span>
            <div className="w-1 h-1 rounded-full bg-border hidden sm:block"></div>
            
            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
               <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></span> 
               <span>To Do <span className="text-foreground/60 ml-0.5">({todoCount})</span></span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
               <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></span> 
               <span>In Progress <span className="text-foreground/60 ml-0.5">({inProgressCount})</span></span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
               <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span> 
               <span>Selesai <span className="text-foreground/60 ml-0.5">({doneCount})</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ADD TASK DIALOG ================= */}
      <Dialog.Root open={openAdd} onOpenChange={setOpenAdd}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <Dialog.Title className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconPlus className="h-4 w-4 text-primary" />
                <span>Buat Task Baru</span>
              </Dialog.Title>
              <button 
                onClick={() => setOpenAdd(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            
            <TaskForm 
              state={newTask} 
              setState={setNewTask} 
              labels={labels} 
              onCreateLabel={handleCreateLabel} 
              onUpdateLabel={handleUpdateLabel}
              onDeleteLabel={handleDeleteLabel}
              invitedMembers={boardMembers} 
            />
            
            <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenAdd(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button size="sm" onClick={createTask} disabled={isSaving} className="rounded-xl text-xs font-semibold">
                {isSaving ? "Menyimpan..." : "Buat Task"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ================= EDIT TASK DIALOG ================= */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <Dialog.Title className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconPencil className="h-4 w-4 text-primary" />
                <span>Edit Detail Task</span>
              </Dialog.Title>
              <button 
                onClick={() => setEditOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {editing && (
              <TaskForm 
                state={editing} 
                setState={(updater) => setEditing(prev => {
                  const newer = typeof updater === 'function' ? updater(prev) : updater
                  return { ...prev!, ...newer }
                })} 
                labels={labels} 
                onCreateLabel={handleCreateLabel} 
                onUpdateLabel={handleUpdateLabel}
                onDeleteLabel={handleDeleteLabel}
                invitedMembers={boardMembers} 
              />
            )}

            <div className="pt-3 border-t border-border/60 flex justify-between items-center gap-2">
              <div>
                {canModify && editing?._id && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs rounded-xl" 
                    onClick={() => editing._id && deleteTask(editing._id)}
                  >
                    Hapus Task
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {canModify && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {isAutoSaving ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Tersimpan otomatis</span>
                      </>
                    )}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} className="rounded-xl text-xs font-semibold">
                  Tutup
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
