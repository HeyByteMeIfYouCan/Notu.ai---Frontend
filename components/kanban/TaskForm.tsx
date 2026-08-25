import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label" 
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconPencil, IconTrash, IconCalendar, IconFlag, IconUser, IconTag, IconSearch } from "@tabler/icons-react"
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

const priorities = [
  { value: "low", label: "Low", colorClass: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20" },
  { value: "medium", label: "Medium", colorClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "high", label: "High", colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "urgent", label: "Urgent", colorClass: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
]

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
  const [newLabelName, setNewLabelName] = useState("")

  const randomLabelColor = () => {
    const palette = [
      "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
      "#f97316", "#eab308", "#10b981", "#06b6d4",
      "#3b82f6", "#64748b"
    ]
    return palette[Math.floor(Math.random() * palette.length)]
  }

  const assignedMember = invitedMembers.find(m => m.id === state.assignee)

  return (
    <div className="mt-4 space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs font-semibold text-foreground/90">
          Judul Task <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="title" 
          value={state.title || ""} 
          onChange={(e) => setState((s: any) => ({ ...s, title: e.target.value }))} 
          placeholder="Contoh: Implementasi autentikasi Google" 
          className="h-10 text-sm font-medium rounded-xl border-border/60 bg-background/50 shadow-xs focus-visible:ring-primary/30"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="desc" className="text-xs font-semibold text-foreground/90">
          Deskripsi
        </Label>
        <textarea 
          id="desc" 
          className="w-full rounded-xl border border-border/60 bg-background/50 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30 shadow-xs min-h-[90px] resize-y" 
          rows={3} 
          value={state.description || ""} 
          onChange={(e) => setState((s: any) => ({ ...s, description: e.target.value }))} 
          placeholder="Tambahkan detail atau instruksi untuk task ini..." 
        />
      </div>
      
      {/* Members & Labels row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {/* Assignee / Members */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
            <IconUser className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Assignee</span>
          </Label>
          <div className="flex items-center gap-2">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button type="button" className="flex-1 flex items-center justify-between h-9 px-3 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/50 transition-colors shadow-xs">
                  {assignedMember ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                        {assignedMember.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{assignedMember.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pilih Assignee...</span>
                  )}
                  <IconPlus className="h-3.5 w-3.5 text-muted-foreground/70" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-5 shadow-2xl space-y-3">
                  <Dialog.Title className="text-sm font-semibold text-foreground">Pilih Anggota</Dialog.Title>
                  <Input 
                    placeholder="Cari anggota..." 
                    className="h-8 text-xs rounded-lg" 
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                  />
                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                    {invitedMembers.filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase())).map((m) => (
                      <button 
                        key={m.id} 
                        type="button" 
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          state.assignee === m.id 
                            ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                            : 'hover:bg-muted text-foreground'
                        }`} 
                        onClick={() => setState((s: any) => ({ ...s, assignee: s.assignee === m.id ? null : m.id }))}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{m.name}</span>
                        </div>
                        {state.assignee === m.id && <span className="text-[11px] font-semibold">✓</span>}
                      </button>
                    ))}
                    {invitedMembers.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Tidak ada anggota terdaftar</p>
                    )}
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
            <IconTag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Labels</span>
          </Label>
          <div className="flex flex-col gap-2">
            {/* Selected labels preview */}
            {(state.labelIds || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(state.labelIds || []).map((id: string) => {
                  const item = labels.find((l) => l.id === id)
                  if (!item) return null
                  return (
                    <span 
                      key={id} 
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white inline-flex items-center shadow-xs" 
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name}
                    </span>
                  )
                })}
              </div>
            )}
            
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button type="button" className="flex w-full items-center justify-between h-9 px-3 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/50 transition-colors shadow-xs">
                  <span className="text-xs text-muted-foreground">Pilih atau tambah Label...</span>
                  <IconPlus className="h-3.5 w-3.5 text-muted-foreground/70" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-5 shadow-2xl space-y-3">
                  <Dialog.Title className="text-sm font-semibold text-foreground">Kelola Label</Dialog.Title>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <IconSearch className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Cari label yang sudah ada..." 
                      className="h-8 pl-8 text-xs rounded-lg bg-background/50" 
                      value={searchLabel}
                      onChange={(e) => setSearchLabel(e.target.value)}
                    />
                  </div>

                  {/* Label List */}
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {labels.filter(l => l.name.toLowerCase().includes(searchLabel.toLowerCase())).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Label tidak ditemukan</p>
                    ) : (
                      labels.filter(l => l.name.toLowerCase().includes(searchLabel.toLowerCase())).map((lbl) => {
                        const active = (state.labelIds || []).includes(lbl.id)
                        const isEditing = editingLabelId === lbl.id

                        return (
                          <div key={lbl.id} className="group flex items-center gap-1.5">
                            {isEditing ? (
                              <div className="flex flex-1 gap-1">
                                <Input 
                                  value={editLabelName} 
                                  onChange={(e) => setEditLabelName(e.target.value)}
                                  className="h-7 text-xs flex-1 rounded-md"
                                  autoFocus
                                />
                                <Button size="sm" className="h-7 px-2 text-[10px]" onClick={async () => {
                                  if (editLabelName.trim()) {
                                    await onUpdateLabel(lbl.id, { name: editLabelName.trim() })
                                  }
                                  setEditingLabelId(null)
                                }}>Simpan</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-1 text-[10px]" onClick={() => setEditingLabelId(null)}>✕</Button>
                              </div>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => setState((s: any) => {
                                  const set = new Set<string>(s.labelIds || [])
                                  active ? set.delete(lbl.id) : set.add(lbl.id)
                                  return { ...s, labelIds: Array.from(set) }
                                })} 
                                className="flex flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-opacity hover:opacity-90 font-medium text-white shadow-2xs" 
                                style={{ backgroundColor: lbl.color }}
                              >
                                <span>{lbl.name}</span>
                                <span className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[10px] font-bold ${active ? 'bg-white/30 text-white' : 'bg-black/10'}`}>
                                  {active ? "✓" : ""}
                                </span>
                              </button>
                            )}

                            {!isEditing && (
                              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
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
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Hapus label "${lbl.name}"?`)) onDeleteLabel(lbl.id)
                                  }}
                                >
                                  <IconTrash className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Create New Label Box */}
                  <div className="bg-muted/40 rounded-xl p-3 border border-border/50 space-y-2 mt-2">
                    <span className="text-[11px] font-semibold text-foreground/80">Atau Buat Label Baru</span>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Ketik nama label..." 
                        className="h-8 text-xs rounded-lg bg-background" 
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const name = newLabelName.trim()
                            if (!name) return
                            await onCreateLabel({ name, color: randomLabelColor() })
                            setNewLabelName("")
                          }
                        }}
                      />
                      <Button 
                        className="h-8 px-3 text-xs shrink-0 rounded-lg shadow-xs" 
                        onClick={async () => {
                          const name = newLabelName.trim()
                          if (!name) return
                          await onCreateLabel({ name, color: randomLabelColor() })
                          setNewLabelName("")
                        }}
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>

      {/* Due Date & Priority row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {/* Due date */}
        <div className="space-y-1.5">
          <Label htmlFor="dueDate" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
            <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tenggat Waktu</span>
          </Label>
          <Input 
            id="dueDate"
            type="datetime-local" 
            className="h-9 text-xs rounded-xl border-border/60 bg-background/50 shadow-xs focus-visible:ring-primary/30"
            value={state.dueDate ? new Date(state.dueDate).toISOString().slice(0, 16) : ""} 
            onChange={(e) => setState((s: any) => ({ ...s, dueDate: e.target.value }))} 
          />
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <Label htmlFor="priority" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
            <IconFlag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Prioritas</span>
          </Label>
          <div className="grid grid-cols-4 gap-1.5">
            {priorities.map((p) => {
              const isSelected = (state.priority || "medium").toLowerCase() === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setState((s: any) => ({ ...s, priority: p.value }))}
                  className={`h-9 text-xs font-semibold rounded-xl border transition-all ${
                    isSelected 
                      ? `${p.colorClass} ring-1 ring-primary/30 shadow-xs` 
                      : 'bg-muted/30 text-muted-foreground border-border/60 hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
