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
import { IconLoader2, IconLayoutBoard, IconSearch, IconCalendar, IconCheck } from "@tabler/icons-react"
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

        // Backend now provides `actionItemsCount` and `hasBoard` for each meeting
        // Keep only meetings that have action items and do not already have a board
        const filtered = (list || []).filter((m: any) => {
          const actionCount = m.actionItemsCount || (m.actionItems && m.actionItems.length) || 0
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
    if (!isReady) return toast.error('Silakan login terlebih dahulu')
    if (!selectedMeeting) return toast.error('Pilih meeting terlebih dahulu')
    setIsSubmitting(true)
    try {
      const res = await api.createBoardFromMeeting(selectedMeeting)
      const board = res?.data || res
      toast.success('Kanban board berhasil digenerate')
      onClose()
      router.push(`/dashboard/kanban/${board._id || board.data?._id || board.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal generate board')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualCreate = async () => {
    if (!isReady) return toast.error('Silakan login terlebih dahulu')
    if (!title) return toast.error('Judul board wajib diisi')
    setIsSubmitting(true)
    try {
      const res = await api.createBoard({ title, description })
      const board = res?.data || res
      toast.success('Board berhasil dibuat')
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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 bg-background">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IconLayoutBoard className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Buat Board Baru</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Pilih cara untuk memulai papan kanban Anda.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          {/* Segmented Control */}
          <div className="flex p-1 bg-muted/60 rounded-xl mb-6">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'import' ? 'bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode('import')}
            >
              Generate dari Meeting
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'manual' ? 'bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode('manual')}
            >
              Buat Manual
            </button>
          </div>

          {mode === 'import' ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 bg-background border border-border/60 rounded-xl px-3 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                <IconSearch className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input 
                  placeholder="Cari meeting yang memiliki action items..." 
                  value={meetingControls.searchInput} 
                  onChange={(e:any) => meetingControls.setSearchInput(e.target.value)} 
                  className="flex-1 h-10 border-none shadow-none focus-visible:ring-0 px-1 text-sm bg-transparent" 
                />
                <div className="h-5 w-px bg-border/60 hidden sm:block mx-1"></div>
                <Select value={meetingControls.filter} onValueChange={(v:any)=>meetingControls.setFilter(v)}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-10 border-none shadow-none focus:ring-0 text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="mine">Saya</SelectItem>
                    <SelectItem value="shared">Dibagikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
                {meetings.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-muted/20">
                    <p className="text-sm font-medium text-foreground">Tidak ada meeting yang tersedia</p>
                    <p className="text-xs text-muted-foreground mt-1">Hanya meeting yang memiliki *Action Items* dan belum diubah menjadi board yang akan muncul di sini.</p>
                  </div>
                ) : meetings.map((m:any) => (
                  <div 
                    key={m._id} 
                    className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${selectedMeeting === m._id ? 'border-primary bg-primary/[0.03] ring-1 ring-primary' : 'border-border/60 bg-card hover:border-border hover:bg-muted/30 hover:shadow-sm'}`} 
                    onClick={() => setSelectedMeeting(m._id)} 
                  >
                    {selectedMeeting === m._id && (
                      <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <IconCheck className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 pr-8">
                      <div className="font-semibold text-sm text-foreground line-clamp-1">{m.title || "Meeting Tanpa Judul"}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{m.summarySnippet || m.description || "Tidak ada deskripsi"}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-muted-foreground">
                        <IconCalendar className="h-3 w-3" />
                        {new Date(m.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="mx-1">•</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border/50">{m.actionItemsCount || (m.actionItems?.length)} Tasks</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleImport} 
                  disabled={!selectedMeeting || isSubmitting} 
                  className="rounded-xl px-6 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  {isSubmitting ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : 'Generate Kanban Board'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  Judul Board <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder="Contoh: Sprint Planning Q3" 
                  value={title} 
                  onChange={(e:any)=>setTitle(e.target.value)} 
                  className="h-11 rounded-xl bg-background border-border/60 shadow-sm focus-visible:ring-1 focus-visible:ring-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  Deskripsi <span className="text-muted-foreground font-normal">(Opsional)</span>
                </label>
                <Input 
                  placeholder="Catatan singkat tentang board ini..." 
                  value={description} 
                  onChange={(e:any)=>setDescription(e.target.value)} 
                  className="h-11 rounded-xl bg-background border-border/60 shadow-sm focus-visible:ring-1 focus-visible:ring-primary" 
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleManualCreate} 
                  disabled={!title || isSubmitting} 
                  className="rounded-xl px-6 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  {isSubmitting ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Buat Board'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
