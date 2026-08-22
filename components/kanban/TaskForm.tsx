import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label" 
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"
import * as Dialog from "@radix-ui/react-dialog"
import { useState } from "react"
import { BoardLabel } from "./types"

interface TaskFormProps {
  state: any
  setState: (updater: any) => void
  labels: BoardLabel[]
  onCreateLabel: (label: Omit<BoardLabel, "id">) => Promise<void>
  onUpdateLabel: (id: string, updates: Partial<BoardLabel>) => Promise<void>
  onDeleteLabel: (id: string) => Promise<void>
  invitedMembers: { id: string, name: string }[]
}

export function TaskForm({ 
  state, 
  setState, 
  labels, 
  onCreateLabel, 
  onUpdateLabel, 
  onDeleteLabel, 
  invitedMembers 
}: TaskFormProps) {
  const [searchMember, setSearchMember] = useState("")
  const [searchLabel, setSearchLabel] = useState("")
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editLabelName, setEditLabelName] = useState("")

  const randomLabelColor = () => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue} 90% 55%)`
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          value={state.title} 
          onChange={(e) => setState((s: any) => ({ ...s, title: e.target.value }))} 
          placeholder="Task title" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <textarea 
          id="desc" 
          className="w-full rounded-md border bg-background p-2 text-sm" 
          rows={4} 
          value={state.description} 
          onChange={(e) => setState((s: any) => ({ ...s, description: e.target.value }))} 
          placeholder="Details" 
        />
      </div>
      
      {/* Members / Labels / Due date row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Members */}
        <div className="space-y-2">
          <Label>Members</Label>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-[10px] font-semibold text-white ring-2 ring-background">
                {invitedMembers.find(m => m.id === state.assignee)?.name?.[0] || "?"}
              </div>
            </div>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <IconPlus className="h-3.5 w-3.5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                  <Dialog.Title className="text-sm font-semibold">Members</Dialog.Title>
                  <div className="mt-3 space-y-2">
                    <Input 
                      placeholder="Search members" 
                      className="h-8 text-xs" 
                      onChange={(e) => setSearchMember(e.target.value)}
                    />
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {invitedMembers.filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase())).map((m) => (
                        <button 
                          key={m.id} 
                          type="button" 
                          className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${state.assignee === m.id ? 'bg-purple-50 text-purple-600' : 'hover:bg-accent'}`} 
                          onClick={() => setState((s: any) => ({ ...s, assignee: s.assignee === m.id ? null : m.id }))}
                        >
                          <span>{m.name}</span>
                          {state.assignee === m.id && <span className="text-xs">Selected</span>}
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
            <div className="flex flex-wrap gap-1 max-w-[150px]">
              {(state.labelIds || []).map((id: string) => {
                const item = labels.find((l) => l.id === id)
                if (!item) return null
                return <Badge key={id} className="text-[10px] px-1.5 h-5" style={{ backgroundColor: item.color, color: "white" }}>{item.name}</Badge>
              })}
            </div>
            
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <IconPlus className="h-3.5 w-3.5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                  <Dialog.Title className="text-sm font-semibold">Manage Labels</Dialog.Title>
                  <div className="mt-3 space-y-2">
                    <Input 
                      placeholder="Search labels..." 
                      className="h-8 text-xs" 
                      onChange={(e) => setSearchLabel(e.target.value)}
                    />
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {labels.filter(l => l.name.toLowerCase().includes(searchLabel.toLowerCase())).map((lbl) => {
                        const active = (state.labelIds || []).includes(lbl.id)
                        const isEditing = editingLabelId === lbl.id

                        return (
                          <div key={lbl.id} className="group flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex flex-1 gap-1">
                                <Input 
                                  value={editLabelName} 
                                  onChange={(e) => setEditLabelName(e.target.value)}
                                  className="h-8 text-xs flex-1"
                                  autoFocus
                                />
                                <Button size="sm" className="h-8 px-2 text-[10px]" onClick={async () => {
                                  if (editLabelName.trim()) {
                                    await onUpdateLabel(lbl.id, { name: editLabelName.trim() })
                                  }
                                  setEditingLabelId(null)
                                }}>Save</Button>
                                <Button size="sm" variant="ghost" className="h-8 px-1 text-[10px]" onClick={() => setEditingLabelId(null)}>X</Button>
                              </div>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => setState((s: any) => {
                                  const set = new Set<string>(s.labelIds || [])
                                  active ? set.delete(lbl.id) : set.add(lbl.id)
                                  return { ...s, labelIds: Array.from(set) }
                                })} 
                                className={`flex flex-1 items-center justify-between rounded-md px-2 py-2 text-left text-xs transition-colors hover:opacity-80`} 
                                style={{ backgroundColor: lbl.color }}
                              >
                                <span className="font-medium text-white">{lbl.name}</span>
                                <span className={`h-3 w-3 rounded-sm border ${active ? 'bg-black/70' : 'bg-white/50'}`}></span>
                              </button>
                            )}

                            {!isEditing && (
                              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-white bg-slate-400 hover:bg-slate-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingLabelId(lbl.id)
                                      setEditLabelName(lbl.name)
                                    }}
                                >
                                  <IconPencil className="h-3 w-3" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-white bg-red-400 hover:bg-red-500 ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if(confirm(`Hapus label "${lbl.name}"?`)) onDeleteLabel(lbl.id)
                                    }}
                                >
                                  <IconTrash className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-2 pt-2 border-t">
                      <Input placeholder="New label name" className="h-8 text-xs" id="new-label-name" />
                      <Button className="h-8 px-3 text-xs" onClick={async () => {
                        const input = document.getElementById('new-label-name') as HTMLInputElement | null
                        const name = input?.value?.trim()
                        if (!name) return
                        await onCreateLabel({ name, color: randomLabelColor() })
                        if(input) input.value = ""
                      }}>Create</Button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Due date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input 
            id="dueDate"
            type="datetime-local" 
            className="h-9 text-xs"
            value={state.dueDate ? new Date(state.dueDate).toISOString().slice(0, 16) : ""} 
            onChange={(e) => setState((s: any) => ({ ...s, dueDate: e.target.value }))} 
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select 
            id="priority"
            className="w-full h-9 rounded-md border bg-background px-2 text-xs"
            value={state.priority || "medium"}
            onChange={(e) => setState((s: any) => ({ ...s, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
    </div>
  )
}
