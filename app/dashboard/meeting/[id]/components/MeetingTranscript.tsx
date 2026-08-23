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
  IconChecks,
  IconMaximize,
  IconMinimize,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolume3,
  IconX,
  IconInfoCircle,
  IconMessage
} from "@tabler/icons-react"
import { RefObject, useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AskAI } from "./AskAI"
import { getPermissions, getRoleLabel } from "@/lib/permissions"
import type { Collaborator, CollaboratorRole, Meeting, TranscriptionSegment, User } from "@/lib/types"
import type { AuthUser } from "@/hooks/use-auth"

interface MeetingTranscriptProps {
  meetingId: string
  userRole?: CollaboratorRole | 'owner' | string
  transcriptSegments: TranscriptionSegment[]
  filteredSegments: TranscriptionSegment[]
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
  audioRef?: RefObject<HTMLAudioElement | null>
  videoRef: RefObject<HTMLVideoElement | null>
  isVideoFile: boolean
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  togglePlayPause: () => void
  transcriptContainerRef: RefObject<HTMLDivElement | null>
  onUpdateSpeaker: (oldName: string, newName: string, segmentIndex: number, applyToAll: boolean) => Promise<void>
  meeting: Meeting
  collaborators?: Collaborator[]
  user: AuthUser | User | null
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
  audioRef,
  videoRef,
  isVideoFile,
  isPlaying,
  setIsPlaying,
  togglePlayPause,
  transcriptContainerRef,
  onUpdateSpeaker,
  meeting,
  collaborators,
  user
}: MeetingTranscriptProps) {
  const [activeTab, setActiveTab] = useState("transcript")
  const [isEditingSpeaker, setIsEditingSpeaker] = useState(false)
  const [editingSegment, setEditingSegment] = useState<{ index: number, name: string } | null>(null)
  const [newSpeakerName, setNewSpeakerName] = useState("")
  const [updateScope, setUpdateScope] = useState<"single" | "all">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [popupCurrentTime, setPopupCurrentTime] = useState(0)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [wasPlayingBeforeTabSwitch, setWasPlayingBeforeTabSwitch] = useState(false)
  const popupSegmentsRef = useRef<HTMLDivElement>(null)

  // Permission checks
  const permissions = useMemo(() => getPermissions(userRole), [userRole])
  const canEditSegments = permissions.canEditSegments
  const canAskAI = permissions.showAskAI

  // Handle tab changes - MUST pause when leaving transcript tab
  const handleTabChange = useCallback((value: string) => {
    const media = videoRef.current || audioRef?.current
    
    // When leaving transcript to ask-ai, MUST pause video/audio
    if (activeTab === 'transcript' && value === 'ask-ai') {
      if (media && !media.paused) {
        setWasPlayingBeforeTabSwitch(true)
        media.pause()
        setIsPlaying(false)
      } else {
        setWasPlayingBeforeTabSwitch(false)
      }
    }
    // When returning to transcript from ask-ai, resume if was playing
    if (activeTab === 'ask-ai' && value === 'transcript') {
      if (wasPlayingBeforeTabSwitch && media) {
        media.play().catch(err => console.error('Resume failed:', err))
        setIsPlaying(true)
      }
    }
    setActiveTab(value)
  }, [activeTab, videoRef, wasPlayingBeforeTabSwitch])

  // Find current segment for subtitle in popup
  const currentPopupSegment = useMemo(() => {
    return transcriptSegments.find(
      (seg: TranscriptionSegment) => seg.start <= popupCurrentTime && seg.end >= popupCurrentTime
    )
  }, [transcriptSegments, popupCurrentTime])

  // Find current segment for subtitle in mini player
  const currentMiniSegment = useMemo(() => {
    return transcriptSegments.find(
      (seg: TranscriptionSegment) => seg.start <= currentTime && seg.end >= currentTime
    )
  }, [transcriptSegments, currentTime])

  // Update popup current time from video
  useEffect(() => {
    if (!isVideoPopupOpen || !videoRef.current) return
    
    const video = videoRef.current
    const handleTimeUpdate = () => {
      setPopupCurrentTime(video.currentTime)
      
      // Auto-scroll to active segment in popup
      if (popupSegmentsRef.current) {
        const activeIndex = transcriptSegments.findIndex(
          (seg: TranscriptionSegment) => seg.start <= video.currentTime && seg.end >= video.currentTime
        )
        if (activeIndex !== -1) {
          const segmentElement = popupSegmentsRef.current.children[activeIndex] as HTMLElement
          if (segmentElement) {
            segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
    }
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isVideoPopupOpen, transcriptSegments, videoRef])

  // Handle popup close - stop video
  const handlePopupClose = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsVideoPopupOpen(false)
  }, [videoRef])

  // Open video popup
  const openVideoPopup = useCallback(() => {
    setIsVideoPopupOpen(true)
    setPopupCurrentTime(currentTime)
  }, [currentTime])

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }, [videoRef])

  const handleEditSpeaker = (index: number, name: string) => {
    if (!canEditSegments) return
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
    <div className="w-80 border-l hidden xl:flex xl:flex-col bg-background-2">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="transcript" className="flex-1">Transkrip</TabsTrigger>
          {/* Only show Ask AI tab if user has permission */}
          {canAskAI && (
            <TabsTrigger value="ask-ai" className="flex-1 flex items-center justify-center gap-1.5">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-[10px] text-primary-foreground">AI</div>
              Ask AI
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="transcript" className="flex-1 flex flex-col overflow-hidden m-0">
          {isVideoFile && (
            <div className="p-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video group">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                  />
                )}
                
                {/* Subtitle Overlay for Mini Player */}
                {subtitlesEnabled && currentMiniSegment && (
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center px-2 pointer-events-none">
                    <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg max-w-[95%] text-center text-[10px] leading-relaxed">
                      <span className="font-semibold text-accent">{currentMiniSegment.speaker}: </span>
                      <span className="text-primary-foreground/90">{currentMiniSegment.text}</span>
                    </div>
                  </div>
                )}
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                  {/* Progress Bar */}
                  <div 
                    className="w-full bg-white/30 rounded-full cursor-pointer group/bar mb-2 h-1"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const percent = (e.clientX - rect.left) / rect.width
                      if (videoRef.current) {
                        videoRef.current.currentTime = percent * totalDuration
                      }
                    }}
                  >
                    <div 
                      className="relative h-full rounded-full bg-primary transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/bar:bg-primary/80 motion-reduce:transition-none"
                      style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={togglePlayPause}
                        className="hover:bg-white/20 rounded-full transition-colors p-1"
                      >
                        {isPlaying ? (
                          <IconPlayerPause className="h-4 w-4" />
                        ) : (
                          <IconPlayerPlay className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        onClick={toggleMute}
                        className="hover:bg-white/20 rounded-full transition-colors p-1"
                      >
                        {isMuted ? (
                          <IconVolume3 className="h-4 w-4" />
                        ) : (
                          <IconVolume className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-[10px]">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                        className={`hover:bg-white/20 rounded-full transition-colors p-1 relative ${subtitlesEnabled ? 'text-primary' : 'opacity-50'}`}
                        title={subtitlesEnabled ? "Nonaktifkan Subtitle" : "Aktifkan Subtitle"}
                      >
                        <IconMessage className="h-4 w-4" />
                        {!subtitlesEnabled && (
                          <span className="absolute w-0.5 h-5 bg-current rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </button>
                      <button 
                        onClick={openVideoPopup}
                        className="hover:bg-white/20 rounded-full transition-colors p-1"
                        title="Perbesar Video"
                      >
                        <IconMaximize className="h-4 w-4" />
                      </button>
                    </div>
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
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded font-medium transition-colors ${
                  autoFollow ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
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
                    className={`group cursor-pointer rounded-xl bg-card p-3 transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isActive 
                        ? 'border-2 border-primary shadow-md bg-primary/10' 
                        : 'border-2 border-border bg-background hover:border-primary/30'
                    }`}
                    onClick={() => jumpToTimestamp(segment.start)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        isActive ? 'bg-primary' : 'bg-emerald-500'
                      }`}>
                        {segment.speaker ? segment.speaker.charAt(segment.speaker.length - 1) : 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-semibold ${
                              isActive ? 'text-primary' : 'text-foreground'
                            }`}>{segment.speaker}</span>
                            {canEditSegments && (
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
                            )}
                          </div>
                          <span className={`text-xs font-medium ${
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}>{formatTime(segment.start)}</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        }`}>{segment.text}</p>
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
                onChange={(e) => setUpdateScope(e.target.value === 'single' ? 'single' : 'all')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="single">Ganti hanya segmen ini saja</option>
                <option value="all">Ganti di semua percakapan ({editingSegment?.name})</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-primary/10 italic">
              <strong className="text-foreground">Tips:</strong> Gunakan "Semua Segmen" untuk mengganti identitas pembicara di seluruh transkrip secara otomatis.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSpeaker(false)} disabled={isSubmitting}>Batal</Button>
            <Button 
              className="bg-primary hover:opacity-90 transition-opacity flex items-center gap-2 px-8 font-semibold"
              disabled={isSubmitting || !newSpeakerName.trim()}
              onClick={submitSpeakerUpdate}
            >
              {isSubmitting ? <IconReload className="h-4 w-4 animate-spin" /> : <IconChecks className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Popup Modal - Improved fullscreen UI */}
      <Dialog open={isVideoPopupOpen} onOpenChange={handlePopupClose}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 flex flex-col overflow-hidden bg-background border-2 border-border shadow-2xl">
          <DialogTitle className="sr-only">Video Player</DialogTitle>
          
          {/* Main Content - Video (65%) + Segments (35%) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Video Section - 65% */}
            <div className="w-[65%] bg-black flex flex-col relative">
              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="flex-1 w-full object-contain bg-black"
                />
              )}
              
              {/* Subtitle Overlay - Only show if enabled */}
              {subtitlesEnabled && currentPopupSegment && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center px-8 pointer-events-none">
                  <div className="bg-black/85 text-white px-6 py-3 rounded-xl max-w-[85%] text-center shadow-xl backdrop-blur-sm">
                    <span className="text-primary font-semibold">{currentPopupSegment.speaker}: </span>
                    <span className="text-base leading-relaxed">{currentPopupSegment.text}</span>
                  </div>
                </div>
              )}
              
              {/* Video Controls - Fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 py-5">
                {/* Progress Bar */}
                <div 
                  className="group mb-4 h-1.5 w-full cursor-pointer rounded-full bg-white/20 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:h-2.5 motion-reduce:transition-none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const percent = (e.clientX - rect.left) / rect.width
                    if (videoRef.current) {
                      videoRef.current.currentTime = percent * totalDuration
                    }
                  }}
                >
                  <div 
                    className="relative h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ width: `${totalDuration > 0 ? (popupCurrentTime / totalDuration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border-2 border-primary" />
                  </div>
                </div>
                
                {/* Controls Row */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={togglePlayPause}
                      className="hover:bg-white/20 rounded-full transition-colors p-2.5 bg-white/10"
                    >
                      {isPlaying ? (
                        <IconPlayerPause className="h-7 w-7" />
                      ) : (
                        <IconPlayerPlay className="h-7 w-7" />
                      )}
                    </button>
                    <button 
                      onClick={toggleMute}
                      className="hover:bg-white/20 rounded-full transition-colors p-2"
                    >
                      {isMuted ? (
                        <IconVolume3 className="h-5 w-5" />
                      ) : (
                        <IconVolume className="h-5 w-5" />
                      )}
                    </button>
                    <span className="text-sm font-medium tabular-nums">
                      {formatTime(popupCurrentTime)} / {formatTime(totalDuration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                      className={`hover:bg-white/20 rounded-full transition-colors p-2 relative ${subtitlesEnabled ? 'bg-primary/30 text-primary' : 'opacity-60'}`}
                      title={subtitlesEnabled ? "Nonaktifkan Subtitle" : "Aktifkan Subtitle"}
                    >
                      <IconMessage className="h-5 w-5" />
                      {!subtitlesEnabled && (
                        <span className="absolute w-0.5 h-6 bg-white rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                    <button 
                      onClick={handlePopupClose}
                      className="hover:bg-white/20 rounded-full transition-colors p-2"
                      title="Tutup"
                    >
                      <IconMinimize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Segments Section - 35% */}
            <div className="w-[35%] border-l-2 border-border flex flex-col bg-background">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div>
                  <h4 className="font-semibold text-base text-foreground">Transkrip</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{transcriptSegments.length} segmen</p>
                </div>
                {/* <button 
                  onClick={handlePopupClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Tutup"
                >
                  <IconX className="h-5 w-5 text-muted-foreground" />
                </button> */}
              </div>
              <div 
                ref={popupSegmentsRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {transcriptSegments.map((segment, index) => {
                  const isActive = segment.start <= popupCurrentTime && segment.end >= popupCurrentTime
                  return (
                    <div 
                      key={index}
                      className={`cursor-pointer rounded-xl bg-card p-4 transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        isActive 
                          ? 'border-2 border-primary ring-2 ring-primary/20'
                          : 'border border-border hover:border-primary/30'
                      }`}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = segment.start
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                            isActive ? 'bg-primary' : 'bg-emerald-500'
                          }`}>
                            {segment.speaker ? segment.speaker.charAt(segment.speaker.length - 1) : 'S'}
                          </div>
                          <span className={`text-sm font-semibold ${
                            isActive ? 'text-primary' : 'text-foreground'
                          }`}>{segment.speaker}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {formatTime(segment.start)}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {segment.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
