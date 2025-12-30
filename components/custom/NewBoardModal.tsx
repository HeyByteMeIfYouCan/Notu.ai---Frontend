"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { IconLoader2 } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import useListParams from "@/hooks/use-list-params"

interface NewBoardModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewBoardModal({ isOpen, onClose }: NewBoardModalProps) {
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'import'|'manual'>('import')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Meeting list controls for import flow
  const meetingControls = useListParams({ defaultPageSize: 8, defaultFilter: 'all', defaultType: 'all' })
  const [meetings, setMeetings] = useState<any[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!isReady) return
      try {
        const params: any = { ...meetingControls.queryParams, search: meetingControls.searchQuery }
        const res = await api.getMeetings(params as any)
        const payload = res?.data || res
        const list = payload?.meetings || payload || []

        // Backend now provides `actionItemCount` and `hasBoard` for each meeting
        // Keep only meetings that have action items and do not already have a board
        const filtered = (list || []).filter((m: any) => {
          const actionCount = m.actionItemCount || (m.actionItems && m.actionItems.length) || 0
          const hasBoard = !!m.hasBoard
          return actionCount > 0 && !hasBoard
        })

        setMeetings(filtered)
      } catch (err) {
        console.error(err)
      }
    }
    if (isOpen && mode === 'import') fetchMeetings()
  }, [isOpen, mode, isReady, meetingControls.page, meetingControls.searchQuery, meetingControls.filter])

  const handleImport = async () => {
    if (!isReady) return toast.error('Please login')
    if (!selectedMeeting) return toast.error('Pilih meeting terlebih dahulu')
    setIsSubmitting(true)
    try {
      const res = await api.createBoardFromMeeting(selectedMeeting)
      const board = res?.data || res
      toast.success('Board dibuat dari meeting')
      onClose()
      router.push(`/dashboard/kanban/${board._id || board.data?._id || board.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat board')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualCreate = async () => {
    if (!isReady) return toast.error('Please login')
    if (!title) return toast.error('Masukkan judul board')
    setIsSubmitting(true)
    try {
      const res = await api.createBoard({ title, description })
      const board = res?.data || res
      toast.success('Board dibuat')
      onClose()
      router.push(`/dashboard/kanban/${board._id || board.data?._id || board.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat board')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedMeeting(null)
      setTitle("")
      setDescription("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Board Baru</DialogTitle>
          <DialogDescription>Pilih untuk membuat board manual atau import dari meeting.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'import' ? undefined : 'outline'} onClick={() => setMode('import')}>Import from Meeting</Button>
            <Button variant={mode === 'manual' ? undefined : 'outline'} onClick={() => setMode('manual')}>Create Manual</Button>
          </div>

          {mode === 'import' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input placeholder="Cari meeting..." value={meetingControls.searchInput} onChange={(e:any) => meetingControls.setSearchInput(e.target.value)} className="flex-1" />
                <Select value={meetingControls.filter} onValueChange={(v:any)=>meetingControls.setFilter(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="mine">Saya</SelectItem>
                    <SelectItem value="shared">Dibagikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-72 overflow-auto grid gap-2">
                {meetings.length === 0 ? (
                  <div className="text-sm text-[var(--kanban-muted)]">Tidak ada meeting dengan action items ditemukan</div>
                ) : meetings.map((m:any) => (
                  <div key={m._id} className={`p-3 rounded-md border border-[var(--kanban-column-border)] cursor-pointer ${selectedMeeting === m._id ? 'ring-2 ring-[var(--kanban-primary)]' : ''}`} onClick={() => setSelectedMeeting(m._id)} style={{ background: 'var(--kanban-card-bg)' }}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[var(--kanban-card-foreground)] line-clamp-1">{m.title}</div>
                        <div className="text-xs text-[var(--kanban-muted)] line-clamp-1">{m.summarySnippet || m.description}</div>
                      </div>
                      <div className="text-xs text-[var(--kanban-muted)]">{new Date(m.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleImport} disabled={!selectedMeeting || isSubmitting} className="bg-[var(--kanban-primary)] text-[var(--kanban-primary-foreground)]">
                  {isSubmitting ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : 'Import Selected Meeting'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Board title" value={title} onChange={(e:any)=>setTitle(e.target.value)} />
              <Input placeholder="Description (optional)" value={description} onChange={(e:any)=>setDescription(e.target.value)} />
              <div className="flex justify-end">
                <Button onClick={handleManualCreate} disabled={!title || isSubmitting} className="bg-[var(--kanban-primary)] text-[var(--kanban-primary-foreground)]">
                  {isSubmitting ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Board'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
