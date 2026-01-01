"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  IconReload, 
  IconSearch, 
  IconChevronDown, 
   IconPencil,
  IconUser,
  IconUsers,
  IconChecks
} from "@tabler/icons-react"
import { RefObject, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AskAI } from "./AskAI"

interface MeetingTranscriptProps {
  meetingId: string
  userRole?: string
  transcriptSegments: any[]
  filteredSegments: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  autoFollow: boolean
  setAutoFollow: (follow: boolean) => void
  activeSegmentIndex: number | null
  jumpToTimestamp: (seconds: number) => void
  formatTime: (seconds: number) => string
  currentTime: number
  totalDuration: number
  videoUrl: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  isVideoFile: boolean
  isPlaying: boolean
  togglePlayPause: () => void
  transcriptContainerRef: RefObject<HTMLDivElement | null>
  onUpdateSpeaker: (oldName: string, newName: string, segmentIndex: number, applyToAll: boolean) => Promise<void>
}

export function MeetingTranscript({
  meetingId,
  userRole,
  transcriptSegments,
  filteredSegments,
  searchQuery,
  setSearchQuery,
  autoFollow,
  setAutoFollow,
  activeSegmentIndex,
  jumpToTimestamp,
  formatTime,
  currentTime,
  totalDuration,
  videoUrl,
  videoRef,
  isVideoFile,
  isPlaying,
  togglePlayPause,
  transcriptContainerRef,
  onUpdateSpeaker
}: MeetingTranscriptProps) {
  const [activeTab, setActiveTab] = useState("transcript")
  const [isEditingSpeaker, setIsEditingSpeaker] = useState(false)
  const [editingSegment, setEditingSegment] = useState<{ index: number, name: string } | null>(null)
  const [newSpeakerName, setNewSpeakerName] = useState("")
  const [updateScope, setUpdateScope] = useState<"single" | "all">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditSpeaker = (index: number, name: string) => {
    setEditingSegment({ index, name })
    setNewSpeakerName(name)
    setIsEditingSpeaker(true)
  }

  const submitSpeakerUpdate = async () => {
    if (!editingSegment || !newSpeakerName.trim()) return
    
    try {
      setIsSubmitting(true)
      await onUpdateSpeaker(editingSegment.name, newSpeakerName.trim(), editingSegment.index, updateScope === "all")
      setIsEditingSpeaker(false)
      setEditingSegment(null)
      toast.success("Nama pembicara berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui pembicara")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-80 border-l hidden xl:flex xl:flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="transcript" className="flex-1">Transkrip</TabsTrigger>
          <TabsTrigger value="ask-ai" className="flex-1 flex items-center justify-center gap-1.5">
            <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center text-[10px] text-white">AI</div>
            Ask AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="flex-1 flex flex-col overflow-hidden m-0">
          {isVideoFile && (
            <div className="p-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onPlay={() => {}}
                    onPause={() => {}}
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="w-full h-1 bg-white/30 rounded-full mb-1">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-white text-[10px]">
                    <button onClick={togglePlayPause}>
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-3 pb-3 space-y-2 pt-2">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari transkrip..." 
                className="pl-9 bg-gray-50 border-0 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoFollow(!autoFollow)}
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                  autoFollow ? 'bg-purple-100 text-[var(--primary)]' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoFollow ? "Auto Follow On" : "Auto Follow Off"}
              </button>
            </div>
          </div>

          <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto px-3 space-y-3 pb-20">
            {(searchQuery ? filteredSegments : transcriptSegments).length > 0 ? (
              (searchQuery ? filteredSegments : transcriptSegments).map((segment, index) => {
                const isActive = activeSegmentIndex === index 
                return (
                  <div 
                    key={index} 
                    className={`border rounded-xl p-3 cursor-pointer transition-all group ${
                      isActive 
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm' 
                        : 'border-border/50 hover:bg-muted/30'
                    }`}
                    onClick={() => jumpToTimestamp(segment.start)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {segment.speaker ? segment.speaker.charAt(segment.speaker.length - 1) : 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{segment.speaker}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditSpeaker(index, segment.speaker)
                              }}
                            >
                              <IconPencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                          <span className="text-xs text-purple-600">{formatTime(segment.start)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{segment.text}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">Tidak ada transkrip tersedia</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ask-ai" className="flex-1 flex flex-col m-0 overflow-hidden">
          <AskAI meetingId={meetingId} userRole={userRole} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditingSpeaker} onOpenChange={setIsEditingSpeaker}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Nama Pembicara</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="speaker-name">Nama Baru</Label>
              <Input
                id="speaker-name"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                placeholder="Masukkan nama pembicara..."
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update-scope">Cakupan Pembaruan</Label>
              <select 
                id="update-scope"
                value={updateScope}
                onChange={(e) => setUpdateScope(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="single">Ganti hanya segmen ini saja</option>
                <option value="all">Ganti di semua percakapan ({editingSegment?.name})</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-[var(--primary)]/10 italic">
              <strong>Tips:</strong> Gunakan "Semua Segmen" untuk mengganti identitas pembicara di seluruh transkrip secara otomatis.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSpeaker(false)} disabled={isSubmitting}>Batal</Button>
            <Button 
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 flex items-center gap-2 px-8"
              disabled={isSubmitting || !newSpeakerName.trim()}
              onClick={submitSpeakerUpdate}
            >
              {isSubmitting ? <IconReload className="h-4 w-4 animate-spin" /> : <IconChecks className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
