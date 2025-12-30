"use client"

import * as React from "react"
import { useCallback, useEffect, useState, useRef, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { IconPlus, IconDownload, IconShare2, IconLink, IconPencil, IconCopy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"

import { useApiWithAuth, useAuth } from "@/hooks/use-auth"
import { Task, ColumnId, BoardLabel } from "./types"
import { KanbanColumn } from "./KanbanColumn"
import { TaskCard } from "./TaskCard"
import { TaskForm } from "./TaskForm"
import { getSocket } from "@/lib/socket"
import { Input } from "@/components/ui/input"

// Status format is now consistent: 'in-progress' used everywhere
const columnToStatus: Record<ColumnId, string> = {
  'todo': 'todo',
  'in-progress': 'in-progress',
  'done': 'done'
}

export function KanbanBoard({ boardId }: { boardId?: string }) {
  const { api, isReady } = useApiWithAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Fetch Board info
  const fetchBoardInfo = useCallback(async () => {
    if (!isReady || !boardId) return
    try {
      const response = await api.getBoard(boardId)
      const data = (response as any).data || response
      setBoard(data)
      if (data.labels) {
        setLabels(data.labels.map((l: any) => ({ ...l, id: l._id || l.id })))
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
    // De-duplicate by id
    return Array.from(new Map(members.map(m => [m.id, m])).values())
  }, [board])

  // Defensive derived role (avoid referencing undefined bare `userRole`)
  const role = board?.userRole ?? 'viewer'

  // Labels
  const [labels, setLabels] = useState<BoardLabel[]>([])

  const handleCreateLabel = async (newLabel: Omit<BoardLabel, "id">) => {
    if (!boardId || !board) return
    try {
      const updatedLabelsArray = [...(board.labels || []), newLabel]
      const response = await api.updateBoard(boardId, { labels: updatedLabelsArray })
      const updatedBoard = (response as any).data || response
      setBoard(updatedBoard)
      if (updatedBoard.labels) {
        setLabels(updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id })))
      }
      toast.success("Label created")
    } catch (error) {
      toast.error("Failed to create label")
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
        setLabels(updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id })))
      }
      // Refresh tasks because labels in tasks are strings (names) and might have been renamed
      fetchTasks()
      toast.success("Label updated")
    } catch (error) {
      toast.error("Failed to update label")
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
        setLabels(updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id })))
      }
      // Refresh tasks because labels are removed from tasks on backend
      fetchTasks()
      toast.success("Label deleted")
    } catch (error) {
      toast.error("Failed to delete label")
    }
  }

  // Fetch API
  const fetchTasks = useCallback(async () => {
    if (!isReady) return
    try {
      setIsLoading(true)
      const response = await api.getKanbanTasks(boardId) // Pass boardId
      const kanbanData = (response as any).kanban || response.data || {} // Note: Backend returns { success: true, data: { todo: [], ... } } OR { kanban: ... }? Check API.ts return type implies data.
      
      // Transform backend data to local format
      // Wait, api.ts Interface KanbanResponse says `data: { todo: ... }`.
      // Previous version of page.tsx used `response.kanban`. I should check if backend returns 'kanban' or 'data'.
      // Backend controller usually returns { success: true, kanban: ... } or data.
      // Looking at step 465 api.ts line 48: interface KanbanResponse { data: ... }.
      // BUT backend controller likely sends `kanban`.
      // I will trust the TYPE if I can't verify backend now. But wait, `response.kanban` was in page.tsx line 89.
      // If previous dev used `response.kanban`, maybe api.ts type is wrong or generic `request<T>` returns T.
      // Let's assume response structure matches backend: `data` or `kanban`.
      // To be safe, I'll access whatever is available.
      const rawData = (response as any).kanban || response.data || {}

      const transformTask = (task: any): Task => {
        const labelsFromBackend = task.labels || task.tags || []
        const labelIds = labelsFromBackend.map((name: string) => 
          labels.find(l => l.name === name)?.id
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
          completedDate: task.status === 'done' && task.updatedAt ? 
            new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
        }
      }

      setColumns({
        todo: (rawData.todo || []).map(transformTask),
        'in-progress': (rawData['in-progress'] || []).map(transformTask),
        done: (rawData.done || []).map(transformTask),
      })
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Gagal memuat tasks")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api, boardId, labels])

  useEffect(() => {
    if (isReady) fetchTasks()
  }, [isReady, fetchTasks])

  // Socket.io Integration
  useEffect(() => {
    if (!boardId || !mounted) return

    const socket = getSocket()
    
    socket.emit('join_board', boardId)

    socket.on('task_created', ({ task, userName, taskTitle, userId }) => {
      const currentUserId = (user as any)?.id || (user as any)?._id
      if (userId && userId === currentUserId) return

      toast.info(`${userName} telah membuat task "${taskTitle || task?.title || 'Baru'}"`)
      fetchTasks()
    })

    socket.on('task_updated', ({ task, userName, taskTitle, userId }) => {
      const currentUserId = (user as any)?.id || (user as any)?._id
      if (userId && userId === currentUserId) return

      toast.info(`${userName} telah memperbarui task "${taskTitle || task?.title || 'Tugas'}"`)
      fetchTasks()
    })

    socket.on('task_deleted', ({ taskId, userName, taskTitle, userId }) => {
      const currentUserId = (user as any)?.id || (user as any)?._id
      if (userId && userId === currentUserId) return

      toast.info(`${userName} telah menghapus task "${taskTitle || 'Tugas'}"`)
      fetchTasks()
    })

    socket.on('tasks_reordered', ({ tasks, userName, userId }) => {
      const currentUserId = (user as any)?.id || (user as any)?._id
      if (userId && userId === currentUserId) return
      
      toast.info(`${userName} telah memindahkan posisi task`)
      fetchTasks()
    })

    socket.on('board_updated', ({ board: updatedBoard, userName, userId }) => {
      const currentUserId = (user as any)?.id || (user as any)?._id
      if (userId && userId === currentUserId) return

      toast.info(`${userName} telah memperbarui board`)
      setBoard(updatedBoard)
      if (updatedBoard.labels) {
        setLabels(updatedBoard.labels.map((l: any) => ({ ...l, id: l._id || l.id })))
      }
      fetchTasks()
    })

    return () => {
      socket.emit('leave_board', boardId)
      socket.off('task_created')
      socket.off('task_updated')
      socket.off('task_deleted')
      socket.off('tasks_reordered')
      socket.off('board_updated')
    }
  }, [boardId, mounted, fetchTasks, fetchBoardInfo])

  const handleGenerateShare = async () => {
    if (!isReady || !boardId) return
    try {
      const res = await api.generateBoardShareLink(boardId)
      setShareToken(res.data.shareToken)
    } catch (error) {
      toast.error("Gagal generate link")
    }
  }

  // Permissions
  const canModify = useMemo(() => {
    return role === 'owner' || role === 'editor'
  }, [role])

  const isOwner = useMemo(() => role === 'owner', [role])

  // Title Editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState("")

  const handleUpdateTitle = async () => {
    if (!boardId || !tempTitle.trim()) return
    try {
      await api.updateBoard(boardId, { title: tempTitle })
      setEditingTitle(false)
      toast.success("Judul board diperbarui")
    } catch (e) {
      toast.error("Gagal memperbarui judul")
    }
  }

  // DnD logic
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const activeTaskRef = useRef<Task | null>(null)
  const startColumnRef = useRef<ColumnId | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const onDragStart = (activeId: string) => {
    if (!canModify) return
    let sourceCol: ColumnId | null = null
    const task = Object.values(columns).flat().find((t) => t.id === activeId) || null

    ;(Object.keys(columns) as ColumnId[]).forEach((colId) => {
      if (columns[colId].some((t) => t.id === activeId)) sourceCol = colId
    })

    console.log("[DND] Start:", { activeId, sourceCol })
    startColumnRef.current = sourceCol
    activeTaskRef.current = task
    setActiveId(activeId)
  }

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    if (!canModify) return
    const { over, active } = event
    if (!over) return

    const startCol = startColumnRef.current
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    // Identify final destination column
    let targetCol: ColumnId | null = null
    ;(Object.keys(columns) as ColumnId[]).forEach((colId) => {
      if (columns[colId].some((t) => t.id === overIdStr)) targetCol = colId
    })
    if (!targetCol && (overIdStr === "todo" || overIdStr === "in-progress" || overIdStr === "done")) {
       targetCol = overIdStr as ColumnId
    }

    console.log("[DND] Final Commit:", { activeIdStr, startCol, targetCol })

    if (isReady && targetCol && startCol) {
      setTimeout(async () => {
        try {
          // Send BOTH columns to ensure order consistency
          const destPayload = (columns[targetCol!] as Task[]).filter(Boolean).map((t, idx) => ({
            id: t._id || t.id,
            order: idx,
            status: columnToStatus[targetCol!]
          }))
          
          let totalPayload = [...destPayload]
          if (startCol !== targetCol) {
            const sourcePayload = (columns[startCol] as Task[]).filter(Boolean).map((t, idx) => ({
              id: t._id || t.id,
              order: idx,
              status: columnToStatus[startCol]
            }))
            const destIds = new Set(destPayload.map(p => p.id))
            totalPayload = [
              ...destPayload,
              ...sourcePayload.filter(p => !destIds.has(p.id))
            ]
          }
          
          await api.reorderTasks(totalPayload, boardId)
          console.log("[DND] Persistence Success")
          fetchTasks() // Sync with server for absolute consistency
        } catch (error: any) {
          console.error("[DND] Persistence Failed:", error)
          toast.error(error.message || "Reorder failed")
          fetchTasks()
        }
      }, 0)
    }
    
    startColumnRef.current = null
  }

  const onDragOver = (event: DragEndEvent) => {
    if (!canModify) return
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
    // If over a container logic
    if (!to && (overIdStr === "todo" || overIdStr === "in-progress" || overIdStr === "done")) to = overIdStr as ColumnId
    
    if (!to) return

    if (from === to) {
      const items = [...columns[from]] as Task[]
      const oldIndex = items.findIndex((t) => t.id === activeIdStr)
      const newIndex = items.findIndex((t) => t.id === overIdStr)
      if (newIndex !== -1 && oldIndex !== newIndex) {
        setColumns((prev) => ({ ...prev, [from!]: arrayMove(items, oldIndex, newIndex) }))
      }
      return
    }

    // Move across columns (optimistic visual)
    const fromItems = [...columns[from]] as Task[]
    const toItems = [...columns[to]] as Task[]
    const fromIndex = fromItems.findIndex((t) => t.id === activeIdStr)
    if (fromIndex === -1) return
    
    const [moved] = fromItems.splice(fromIndex, 1) as Task[]
    const overIndex = toItems.findIndex((t) => t.id === overIdStr)
    const insertAt = overIndex >= 0 ? overIndex : toItems.length
    toItems.splice(insertAt, 0, moved)
    
    setColumns((prev) => ({ ...prev, [from!]: fromItems, [to!]: toItems }))
  }

  // Add Task Logic
  const [openAdd, setOpenAdd] = useState(false)
  const [newTask, setNewTask] = useState<Pick<Task, "title" | "description" | "assignee" | "dueDate" | "labelIds" | "priority">>({
    title: "", description: "", assignee: null, dueDate: "", labelIds: [], priority: "medium"
  })

  const createTask = async () => {
    if (!isReady) return
    setIsSaving(true)
    try {
      const response = await api.createTask({
        title: newTask.title || "New Task",
        description: newTask.description || "",
        assignee: newTask.assignee || undefined,
        dueDate: newTask.dueDate || undefined,
        labels: newTask.labelIds?.map(id => labels.find(l => l.id === id)?.name || '').filter(Boolean),
        priority: (newTask as any).priority || 'medium',
        status: 'todo',
        boardId,
      })
      fetchTasks() // Easier than manual construct because response might differ
      setOpenAdd(false)
      setNewTask({ title: "", description: "", assignee: null, dueDate: "", labelIds: [], priority: "medium" })
      toast.success("Task created")
    } catch (e) {
      toast.error("Failed to create task")
    } finally { setIsSaving(false) }
  }

  // Edit Logic
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  
  const openEdit = (task: Task) => {
    setEditing(task)
    setEditOpen(true)
  }
  
  const saveEdit = async () => {
    if (!editing || !isReady || !editing._id) return
    // Optimistic UI
    const update = (items: Task[]) => items.map(t => t.id === editing.id ? editing : t)
    setColumns(prev => ({
      todo: update(prev.todo),
      'in-progress': update(prev['in-progress']),
      done: update(prev.done)
    }))
    setEditOpen(false)

    try {
      await api.updateTask(editing._id, {
        title: editing.title,
        description: editing.description,
        assignee: editing.assignee,
        dueDate: editing.dueDate,
        priority: editing.priority,
        labels: editing.labelIds?.map(id => labels.find(l => l.id === id)?.name || '').filter(Boolean) || editing.labels,
      })
      toast.success("Task updated")
    } catch (e) {
      toast.error("Update failed")
      fetchTasks()
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!isReady) return
    setEditOpen(false)
    try {
      await api.deleteTask(taskId)
      fetchTasks()
      toast.success("Task deleted")
    } catch (e) {
      toast.error("Delete failed")
    }
  }

  if (!mounted) return <div className="p-8">Loading Kanban...</div>

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50/50">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full">
        {/* Header Section */}
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={tempTitle} 
                    onChange={(e) => setTempTitle(e.target.value)} 
                    className="text-2xl font-bold h-10 w-[300px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateTitle()
                      if (e.key === 'Escape') setEditingTitle(false)
                    }}
                  />
                  <Button size="sm" onClick={handleUpdateTitle}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{board?.title || "Kanban Board"}</h1>
                  {canModify && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => {
                        setTempTitle(board?.title || "")
                        setEditingTitle(true)
                      }}
                    >
                      <IconPencil className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <Dialog.Root open={showShare} onOpenChange={setShowShare}>
                  <Dialog.Trigger asChild>
                    <Button variant="outline" className="gap-2" onClick={handleGenerateShare}>
                      <IconShare2 className="h-4 w-4" />
                      Share
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
                      <Dialog.Title className="text-lg font-semibold mb-4">Share Board</Dialog.Title>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Link Akses Collab</label>
                          <div className="flex gap-2">
                            <Input 
                              readOnly 
                              value={shareToken ? `${window.location.origin}/dashboard/join/board/${shareToken}` : "Loading..."} 
                            />
                            <Button size="icon" variant="outline" onClick={() => {
                              if (shareToken) {
                                navigator.clipboard.writeText(`${window.location.origin}/dashboard/join/board/${shareToken}`)
                                toast.success("Link disalin")
                              }
                            }}>
                              <IconCopy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {board?.userRole === 'owner' && (
                          <div className="pt-4 border-t space-y-3">
                            <h3 className="text-sm font-medium">Members</h3>
                            <div className="space-y-2">
                              {board.collaborators?.map((col) => (
                                <div key={col.user._id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                      {col.user.name?.[0]}
                                    </div>
                                    <div>
                                    <p className="text-sm font-medium">{col.user.name}</p>
                                    <select 
                                      className="text-[10px] bg-transparent border-none p-0 h-auto focus:ring-0 text-muted-foreground outline-none"
                                      value={col.role}
                                      onChange={(e) => {
                                        api.updateBoardCollaboratorRole(boardId!, col.user._id, e.target.value).then(() => fetchBoardInfo())
                                      }}
                                    >
                                      <option value="owner">Owner</option>
                                      <option value="editor">Editor</option>
                                      <option value="viewer">Viewer</option>
                                    </select>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-500 h-8 font-normal" onClick={() => {
                                  if(boardId) api.removeBoardCollaborator(boardId, col.user._id).then(() => fetchBoardInfo())
                                }}>Remove</Button>
                              </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              )}

              {canModify && (
                <Button variant="outline" className="gap-2">
                  <IconDownload className="h-4 w-4" /> Export
                </Button>
              )}
              <Dialog.Root open={openAdd} onOpenChange={setOpenAdd}>
                {canModify && (
                  <Dialog.Trigger asChild>
                    <Button className="gap-2">
                      <IconPlus className="h-4 w-4" /> Add Task
                    </Button>
                  </Dialog.Trigger>
                )}
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold">Add Task</Dialog.Title>
                    <TaskForm 
                      state={newTask} 
                      setState={setNewTask} 
                      labels={labels} 
                      onCreateLabel={handleCreateLabel} 
                      onUpdateLabel={handleUpdateLabel}
                      onDeleteLabel={handleDeleteLabel}
                      invitedMembers={boardMembers} 
                    />
                    <div className="pt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                      <Button onClick={createTask} disabled={isSaving}>Create</Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="px-4 lg:px-6 flex-1 overflow-x-auto">
          <DndContext 
            sensors={sensors} 
            onDragEnd={onDragEnd} 
            onDragOver={onDragOver} 
            onDragStart={({ active }) => onDragStart(String(active.id))} 
            collisionDetection={closestCorners}
          >
            <div className="grid gap-6 lg:grid-cols-3 h-full pb-8 min-w-[800px]">
              <KanbanColumn 
                id="todo" 
                title="To Do" 
                tasks={columns.todo} 
                color="#6b4eff" 
                bgLight="bg-purple-50/40"
                bgDark="#e9d5ff" // purple-200
                labels={labels}
                onAddTask={() => setOpenAdd(true)}
                onEditTask={openEdit}
                members={boardMembers}
                canModify={canModify}
              />
              <KanbanColumn 
                id="in-progress" 
                title="In Progress" 
                tasks={columns['in-progress']} 
                color="#f97316" // orange-500
                bgLight="bg-orange-50/40"
                bgDark="#fdba74" // orange-300
                labels={labels}
                onAddTask={() => setOpenAdd(true)}
                onEditTask={openEdit}
                members={boardMembers}
                canModify={canModify}
              />
              <KanbanColumn 
                id="done" 
                title="Done" 
                tasks={columns.done} 
                color="#10b981" // emerald-500
                bgLight="bg-emerald-50/40"
                bgDark="#6ee7b7" // emerald-300
                labels={labels}
                onAddTask={() => setOpenAdd(true)}
                onEditTask={openEdit}
                members={boardMembers}
                canModify={canModify}
              />
            </div>
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
              {activeTaskRef.current ? (
                <div className="scale-[1.02] shadow-2xl opacity-90 cursor-grabbing">
                  <TaskCard task={activeTaskRef.current} labels={labels} showProgress={activeId === 'in-progress'} members={boardMembers} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Stats Footer (Optional, simplified) */}
        <div className="px-4 lg:px-6 mt-auto">
            <div className="grid gap-4 md:grid-cols-4 bg-white p-4 rounded-lg border shadow-sm">
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
            </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold">Edit Task</Dialog.Title>
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
              <div className="pt-4 flex justify-between gap-2 mt-4">
                <div>
                  {canModify && editing?._id && (
                    <Button 
                      variant="ghost" 
                      className="text-red-500 p-0 h-9 px-3" 
                      onClick={() => editing._id && deleteTask(editing._id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  {canModify ? (
                    <Button onClick={saveEdit}>Save Changes</Button>
                  ) : (
                    <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
                  )}
                </div>
              </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
