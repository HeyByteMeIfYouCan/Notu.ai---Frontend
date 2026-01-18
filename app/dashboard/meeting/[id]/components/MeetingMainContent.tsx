"use client"

import { Button } from "@/components/ui/button"
import { 
  IconSparkles, 
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

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
)

interface MeetingMainContentProps {
  meeting: any
  actionItems: any[]
  hasSyncedTasks: boolean
  onUpdateMeeting: (data: any) => Promise<void>
  onRegenerateAi: () => Promise<void>
  onGenerateKanban: () => Promise<void>
  onUpdateContent: (field: any, value: any) => Promise<void>
  formatDate: (date: string) => string
  formatTimeOnly: (date: string) => string
  formatDuration: (seconds: number) => string
  userRole?: string
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

  const executiveSummary = meeting.transcription?.summary || ""
  const highlights = meeting.transcription?.highlights || {}
  const conclusion = meeting.transcription?.conclusion || ""

  const isAiContentAvailable = !!(executiveSummary && 
    executiveSummary.trim().length > 20 && 
    !executiveSummary.toLowerCase().includes("tidak tersedia") &&
    !executiveSummary.toLowerCase().includes("belum dibuat"));

  const handleStartEdit = (field: string, initialValue: string) => {
    setEditingField(field)
    setEditValue(initialValue)
  }

  const handleSaveEdit = async (field: string) => {
    let finalValue: any = editValue
    
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
    <div className="flex-1 overflow-y-auto bg-background-2">
      {/* Meeting Header Info */}
      <div className="px-6 py-4 border-b group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {editingField === 'title' ? (
                <div className="flex items-center gap-2 flex-1 max-w-2xl">
                  <input 
                    className="text-xl font-semibold bg-transparent border-b border-primary focus:outline-none flex-1 text-foreground"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('title')}
                  />
                  <Button size="sm" className="h-8 rounded-lg shadow-sm" onClick={() => handleSaveEdit('title')}>Simpan</Button>
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg text-muted-foreground" onClick={() => setEditingField(null)}>Batal</Button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-foreground">{meeting.title}</h1>
                  {permissions.canEdit && (
                    <button onClick={() => handleStartEdit('title', meeting.title)} className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconPencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {editingField === 'description' ? (
                <div className="flex items-center gap-2 flex-1 max-w-3xl">
                  <input 
                    className="text-sm text-muted-foreground bg-transparent border-b border-primary outline-none flex-1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('description')}
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-[11px] rounded-lg bg-white border border-border shadow-sm hover:bg-gray-50" onClick={() => handleSaveEdit('description')}>Simpan</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg text-muted-foreground" onClick={() => setEditingField(null)}>Batal</Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{meeting.description || "Tambahkan deskripsi..."}</p>
                  {permissions.canEdit && (
                    <button onClick={() => handleStartEdit('description', meeting.description || "")} className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconPencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconInfoCircle className="h-3.5 w-3.5" />
                {meeting.createdAt ? (
                  <>
                    {formatDate(meeting.createdAt)} {formatTimeOnly(meeting.createdAt)} ({formatDuration(meeting.duration || 0)})
                  </>
                ) : (
                  <>Durasi: {formatDuration(meeting.duration || 0)}</>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-medium px-2 py-1 rounded-md text-sm border border-emerald-100">
              {meeting.platform || "Google Meet"}
            </div>
            {meeting.participants > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                {meeting.participants} Orang
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="px-6 py-4 space-y-6 pb-24">
        {!isAiContentAvailable ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-gray-50/50 rounded-3xl border border-gray-100 mt-4">
            <div className="bg-primary/10 p-6 rounded-3xl mb-8">
              <IconSparkles className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Ringkasan tidak tersedia</h3>
            <p className="text-base text-muted-foreground max-w-lg mb-10">
              Belum ada analisis yang dilakukan untuk pertemuan ini. Klik tombol di bawah untuk membuat ringkasan secara otomatis.
            </p>
            <Button size="lg" onClick={onRegenerateAi} className="gap-3 px-12 py-7 text-lg font-bold rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <IconSparkles className="h-6 w-6" />
              Generate Meeting Summary
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-primary">Executive Summary</h2>
                {permissions.canEdit && (
                  <Dialog open={editingField === 'executiveSummary'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogTrigger asChild>
                      <button onClick={() => handleStartEdit('executiveSummary', executiveSummary)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <IconPencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader><DialogTitle>Edit Executive Summary</DialogTitle></DialogHeader>
                      <div data-color-mode="light">
                        <MDEditor value={editValue} onChange={(val) => setEditValue(val || "")} height={300} preview="edit" />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setEditingField(null)}>Batal</Button>
                        <Button onClick={() => handleSaveEdit('executiveSummary')}>Simpan</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{executiveSummary}</ReactMarkdown>
              </div>
            </div>

            {/* Highlights / Notes */}
            {Object.keys(highlights).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-primary">Catatan Rapat</h2>
                  {permissions.canEdit && (
                    <Dialog open={editingField === 'highlights'} onOpenChange={(open) => !open && setEditingField(null)}>
                      <DialogTrigger asChild>
                        <button onClick={() => handleStartEdit('highlights', Object.entries(highlights).map(([k, v]) => `${k}:\n${v}`).join('\n\n'))} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <IconPencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader><DialogTitle>Edit Catatan Rapat</DialogTitle></DialogHeader>
                        <div data-color-mode="light">
                          <MDEditor value={editValue} onChange={(val) => setEditValue(val || "")} height={400} preview="edit" />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => setEditingField(null)}>Batal</Button>
                          <Button onClick={() => handleSaveEdit('highlights')}>Simpan</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="space-y-4">
                  {Object.entries(highlights).map(([header, content]: [string, any]) => (
                    <div key={header}>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="bg-foreground w-1 h-1 rounded-full"></div>
                        <h3 className="font-medium text-sm text-primary">{header}</h3>
                      </div>
                      <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-primary">Action Items</h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground hover:text-primary disabled:opacity-40" onClick={onRegenerateAi} disabled={!permissions.canRegenerateAI}>
                    <IconRefresh className="h-4 w-4" />
                    <span className="text-xs font-medium">Ulangi Analisis</span>
                  </Button>
                  {!hasSyncedTasks && actionItems.length > 0 && (
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground hover:text-primary disabled:opacity-40" onClick={onGenerateKanban} disabled={!permissions.canEdit}>
                      <IconLayoutKanban className="h-4 w-4" />
                      <span className="text-xs font-medium">Buat Board</span>
                    </Button>
                  )}
                </div>
              </div>
              {actionItems.length > 0 ? (
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {actionItems.map((item, index) => (
                    <li key={item.id || index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.title}</span>
                          {item.priority && (
                             <span className={`text-xs px-2 py-0.5 rounded-full ${
                               item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                               item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                               'bg-gray-100 text-gray-700'
                             }`}>
                               {item.priority}
                             </span>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">Tidak ada action items</div>
              )}
            </div>

            {/* Conclusion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-primary">Conclusion</h2>
                {permissions.canEdit && (
                  <Dialog open={editingField === 'conclusion'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogTrigger asChild>
                      <button onClick={() => handleStartEdit('conclusion', conclusion)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <IconPencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader><DialogTitle>Edit Conclusion</DialogTitle></DialogHeader>
                    <div data-color-mode="light">
                      <MDEditor value={editValue} onChange={(val) => setEditValue(val || "")} height={300} preview="edit" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setEditingField(null)}>Batal</Button>
                      <Button onClick={() => handleSaveEdit('conclusion')}>Simpan</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{conclusion || "Tidak ada conclusion tersedia"}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
