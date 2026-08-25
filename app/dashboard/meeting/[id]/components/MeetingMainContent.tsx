"use client"

import { Button } from "@/components/ui/button"
import { 
  IconFileDescription,
  IconInfoCircle, 
  IconPencil, 
  IconRefresh, 
  IconLayoutKanban 
} from "@tabler/icons-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
import { useState, useMemo } from "react"
import { getPermissions } from "@/lib/permissions"
import type { CollaboratorRole, Meeting, TaskCandidate } from "@/lib/types"

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
)

interface MeetingMainContentProps {
  meeting: Meeting
  actionItems: TaskCandidate[]
  hasSyncedTasks: boolean
  onUpdateMeeting: (data: { title?: string; description?: string }) => Promise<void>
  onRegenerateAi: () => Promise<void>
  onGenerateKanban: () => Promise<void>
  onUpdateContent: (field: string, value: string | Record<string, string>) => Promise<void>
  formatDate: (date: string) => string
  formatTimeOnly: (date: string) => string
  formatDuration: (seconds: number) => string
  userRole?: CollaboratorRole | 'owner' | string
}

export function MeetingMainContent({
  meeting,
  actionItems,
  hasSyncedTasks,
  onUpdateMeeting,
  onRegenerateAi,
  onGenerateKanban,
  onUpdateContent,
  formatDate,
  formatTimeOnly,
  formatDuration,
  userRole
}: MeetingMainContentProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  // Get permissions based on user role
  const permissions = useMemo(() => getPermissions(userRole), [userRole])

  const parseNewlines = (str: string) => typeof str === 'string' ? str.replace(/\\n/g, '\n') : str

  const executiveSummary = parseNewlines(meeting.transcription?.summary || "")
  const conclusion = parseNewlines(meeting.transcription?.conclusion || "")
  
  const rawHighlights = meeting.transcription?.highlights || {}
  const highlights = Object.fromEntries(
    Object.entries(rawHighlights).map(([k, v]) => [k, typeof v === 'string' ? parseNewlines(v) : v])
  )

  const isAiContentAvailable = !!(executiveSummary && 
    executiveSummary.trim().length > 20 && 
    !executiveSummary.toLowerCase().includes("tidak tersedia") &&
    !executiveSummary.toLowerCase().includes("belum dibuat"));

  const handleStartEdit = (field: string, initialValue: string) => {
    setEditingField(field)
    setEditValue(initialValue)
  }

  const handleSaveEdit = async (field: string) => {
    let finalValue: string | Record<string, string> = editValue
    
    if (field === 'title' || field === 'description') {
      await onUpdateMeeting({ [field]: editValue })
      setEditingField(null)
      return
    }

    if (field === 'highlights') {
      const lines = editValue.split('\n')
      const highlightsObj: Record<string, string> = {}
      let currentKey = ''
      let currentValue: string[] = []
      
      lines.forEach(line => {
        if (line.trim().endsWith(':')) {
          if (currentKey) highlightsObj[currentKey] = currentValue.join('\n').trim()
          currentKey = line.replace(':', '').trim()
          currentValue = []
        } else {
          currentValue.push(line)
        }
      })
      if (currentKey) highlightsObj[currentKey] = currentValue.join('\n').trim()
      finalValue = highlightsObj
    }
    await onUpdateContent(field, finalValue)
    setEditingField(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-muted/20">
      {/* Meeting Header Info */}
      <div className="group relative overflow-hidden bg-background py-8 shadow-sm">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/2" style={{ background: "radial-gradient(ellipse at 100% 50%, color-mix(in oklch, var(--primary) 8%, transparent), transparent 70%)" }} />
        <div className="flex flex-col gap-4 max-w-6xl mx-auto px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {editingField === 'title' ? (
                  <div className="flex items-center gap-2 flex-1 max-w-2xl">
                    <input 
                      className="text-3xl font-bold tracking-tight bg-transparent border-b-2 border-primary focus:outline-none flex-1 text-foreground"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('title')}
                    />
                    <Button size="sm" className="h-9 rounded-xl shadow-sm font-medium px-4" onClick={() => handleSaveEdit('title')}>Simpan</Button>
                    <Button size="sm" variant="ghost" className="h-9 rounded-xl text-muted-foreground px-4" onClick={() => setEditingField(null)}>Batal</Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{meeting.title}</h1>
                    {permissions.canEdit && (
                      <button onClick={() => handleStartEdit('title', meeting.title)} className="p-1.5 hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconPencil className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-5">
                {editingField === 'description' ? (
                  <div className="flex items-center gap-2 flex-1 max-w-3xl">
                    <input 
                      className="text-base text-muted-foreground bg-transparent border-b border-primary outline-none flex-1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('description')}
                    />
                    <Button size="sm" variant="secondary" className="h-8 rounded-lg bg-white border border-border shadow-sm hover:bg-gray-50" onClick={() => handleSaveEdit('description')}>Simpan</Button>
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg text-muted-foreground" onClick={() => setEditingField(null)}>Batal</Button>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">{meeting.description || "Tambahkan deskripsi..."}</p>
                    {permissions.canEdit && (
                      <button onClick={() => handleStartEdit('description', meeting.description || "")} className="p-1 hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <IconPencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
                  {meeting.platform || "Sistem Notu"}
                </div>
                
                {meeting.createdAt && (
                  <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                    <IconInfoCircle className="h-4 w-4" />
                    {formatDate(meeting.createdAt)} {formatTimeOnly(meeting.createdAt)}
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                  Durasi: {formatDuration(meeting.duration || 0)}
                </div>

                {(() => {
                  const count = Array.isArray(meeting.participants) 
                    ? meeting.participants.length 
                    : (meeting.participantsCount || 0)
                  return count > 0 ? (
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                      {count} Orang
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6 px-8 py-8 pb-32 max-w-6xl mx-auto">
        {!isAiContentAvailable ? (
          <div className="relative mt-4 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-border bg-background px-8 py-24 text-center shadow-sm">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2" style={{ background: "radial-gradient(ellipse at 50% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)" }} />
            <div className="relative mb-8 flex size-24 items-center justify-center rounded-[1.75rem] border border-primary/20 bg-primary/5 shadow-inner">
              <IconFileDescription className="h-10 w-10 text-primary" />
            </div>
            <h3 className="relative mb-4 text-2xl font-bold tracking-tight text-foreground">Ringkasan belum tersedia</h3>
            <p className="relative mb-10 max-w-lg text-base leading-relaxed text-muted-foreground">
              Agar lebih mudah dibaca kembali, mari buat poin penting dan ringkasan dari meeting ini menggunakan kecerdasan buatan.
            </p>
            <Button size="lg" onClick={onRegenerateAi} className="relative h-14 gap-3 rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]">
              <IconFileDescription className="h-5 w-5" />
              Buat ringkasan sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <section className="rounded-[2rem] border border-border/50 bg-background p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <IconFileDescription className="w-5 h-5" />
                  </span>
                  Ringkasan utama
                </h2>
                {permissions.canEdit && (
                  <Dialog open={editingField === 'executiveSummary'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogTrigger asChild>
                      <button onClick={() => handleStartEdit('executiveSummary', executiveSummary)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 px-3 py-1.5 rounded-full">
                        <IconPencil className="h-4 w-4" />
                        Edit
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl rounded-[2rem] p-6 border-border/60 shadow-2xl">
                      <DialogHeader><DialogTitle className="text-xl">Edit ringkasan utama</DialogTitle></DialogHeader>
                      <div data-color-mode="light" className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                        <MDEditor value={editValue} onChange={(val) => setEditValue(val || "")} height={400} preview="edit" className="border-0" />
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" className="rounded-xl px-6" onClick={() => setEditingField(null)}>Batal</Button>
                        <Button className="rounded-xl px-6" onClick={() => handleSaveEdit('executiveSummary')}>Simpan Perubahan</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="prose prose-base sm:prose-lg prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{executiveSummary}</ReactMarkdown>
              </div>
            </section>

            {/* Highlights / Notes */}
            {Object.keys(highlights).length > 0 && (
              <section className="rounded-[2rem] border border-border/50 bg-background p-8 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </span>
                    Poin penting
                  </h2>
                  {permissions.canEdit && (
                    <Dialog open={editingField === 'highlights'} onOpenChange={(open) => !open && setEditingField(null)}>
                      <DialogTrigger asChild>
                        <button onClick={() => handleStartEdit('highlights', Object.entries(highlights).map(([k, v]) => `${k}:\n${v}`).join('\n\n'))} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 px-3 py-1.5 rounded-full">
                          <IconPencil className="h-4 w-4" />
                          Edit
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl rounded-[2rem] p-6 border-border/60 shadow-2xl">
                        <DialogHeader><DialogTitle className="text-xl">Edit poin penting</DialogTitle></DialogHeader>
                        <div data-color-mode="light" className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                          <MDEditor value={editValue} onChange={(val) => setEditValue(val || "")} height={500} preview="edit" className="border-0" />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                          <Button variant="outline" className="rounded-xl px-6" onClick={() => setEditingField(null)}>Batal</Button>
                          <Button className="rounded-xl px-6" onClick={() => handleSaveEdit('highlights')}>Simpan Perubahan</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {Object.entries(highlights).map(([header, content]) => (
                    <div key={header} className="rounded-2xl bg-muted/30 p-5 border border-border/40 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-primary/80 w-2 h-2 rounded-full ring-4 ring-primary/10"></div>
                        <h3 className="font-semibold text-base text-foreground">{header}</h3>
                      </div>
                      <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none text-muted-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof content === 'string' ? content : String(content)}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action Items */}
            <section className="rounded-[2rem] border border-border/50 bg-background p-8 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden">
              <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 relative z-10">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <IconLayoutKanban className="w-5 h-5" />
                  </span>
                  Yang perlu ditindaklanjuti
                </h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-9 rounded-xl gap-2 font-medium bg-background hover:bg-muted hover:text-foreground" onClick={onRegenerateAi} disabled={!permissions.canRegenerateAI}>
                    <IconRefresh className="h-4 w-4" />
                    Analisis ulang
                  </Button>
                  {!hasSyncedTasks && actionItems.length > 0 && (
                    <Button size="sm" className="h-9 rounded-xl gap-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm shadow-emerald-500/20" onClick={onGenerateKanban} disabled={!permissions.canEdit}>
                      <IconLayoutKanban className="h-4 w-4" />
                      Jadikan Kanban Board
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="relative z-10">
                {actionItems.length > 0 ? (
                  <div className="grid gap-4">
                    {actionItems.map((item, index) => (
                      <div key={item.id || index} className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="mt-1.5 flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-semibold text-foreground text-base">{item.title}</span>
                            {item.priority && (
                               <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                 item.priority === 'urgent' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                                 item.priority === 'high' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                                 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                               }`}>
                                 {item.priority}
                               </span>
                            )}
                          </div>
                          {item.description && <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
                    <IconChecks className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Belum ada tindak lanjut terdeteksi.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Conclusion */}
            <section className="rounded-[2rem] border border-border/50 bg-background p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </span>
                  Kesimpulan
                </h2>
                {permissions.canEdit && (
                  <Dialog open={editingField === 'conclusion'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogTrigger asChild>
                      <button onClick={() => handleStartEdit('conclusion', conclusion)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 px-3 py-1.5 rounded-full">
                        <IconPencil className="h-4 w-4" />
                        Edit
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl rounded-[2rem] p-6 border-border/60 shadow-2xl">
                      <DialogHeader><DialogTitle className="text-xl">Edit kesimpulan</DialogTitle></DialogHeader>
                    <div data-color-mode="light" className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                      <MDEditor value={editValue} onChange={(val) => setEditValue(val || "")} height={300} preview="edit" className="border-0" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" className="rounded-xl px-6" onClick={() => setEditingField(null)}>Batal</Button>
                      <Button className="rounded-xl px-6" onClick={() => handleSaveEdit('conclusion')}>Simpan Perubahan</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="prose prose-base sm:prose-lg prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{conclusion || "Belum ada kesimpulan untuk meeting ini."}</ReactMarkdown>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
