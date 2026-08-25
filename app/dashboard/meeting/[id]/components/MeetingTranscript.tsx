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
  IconCheck,
  IconMaximize,
  IconMinimize,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolume3,
  IconX,
  IconInfoCircle,
  IconSubtitles,
  IconSubscript,
  IconMessage
} from "@tabler/icons-react"
import { RefObject, useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  const miniVideoRef = useRef<HTMLVideoElement>(null)
  const fullVideoRef = useRef<HTMLVideoElement>(null)

  // Sync ref and state on open/close
  useEffect(() => {
    if (isVideoPopupOpen) {
      if (fullVideoRef.current && miniVideoRef.current) {
        fullVideoRef.current.currentTime = miniVideoRef.current.currentTime
      }
      if (videoRef) {
         (videoRef as any).current = fullVideoRef.current
      }
      if (isPlaying && fullVideoRef.current) fullVideoRef.current.play()
      if (miniVideoRef.current) miniVideoRef.current.pause()
    } else {
      if (fullVideoRef.current && miniVideoRef.current) {
        miniVideoRef.current.currentTime = fullVideoRef.current.currentTime
      }
      if (videoRef) {
         (videoRef as any).current = miniVideoRef.current
      }
      if (isPlaying && miniVideoRef.current) miniVideoRef.current.play()
      if (fullVideoRef.current) fullVideoRef.current.pause()
    }
  }, [isVideoPopupOpen, isPlaying, videoRef])

  useEffect(() => {
    if (videoRef && !isVideoPopupOpen && miniVideoRef.current) {
      (videoRef as any).current = miniVideoRef.current
    }
  }, [videoRef, isVideoPopupOpen])


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

  const popupClickedTimeRef = useRef<number | null>(null)

  // Update popup current time from video
  useEffect(() => {
    if (!isVideoPopupOpen || !fullVideoRef.current) return
    const video = fullVideoRef.current
    const handleTimeUpdate = () => {
      const time = video.currentTime
      
      if (popupClickedTimeRef.current !== null) {
        if (time < popupClickedTimeRef.current && (popupClickedTimeRef.current - time) < 15) {
          // Video is catching up
          return
        } else if (time >= popupClickedTimeRef.current || (popupClickedTimeRef.current - time) >= 15) {
          popupClickedTimeRef.current = null
        }
      }
      
      setPopupCurrentTime(time)
      
      // Update active segment based on current time
      if (meeting?.transcription?.segments && meeting.transcription.segments.length > 0) {
        // Use findLastIndex to gracefully handle small gaps and floating point precision
        let activeIndex = meeting.transcription.segments.findLastIndex(
          (seg: any) => seg.start <= time
        )
        // If clicking right at the start or before the first segment, default to the first one
        if (activeIndex === -1 && time < meeting.transcription.segments[0].start) {
          activeIndex = 0
        }
        if (activeIndex !== -1 && popupSegmentsRef.current) {
          const segmentElement = popupSegmentsRef.current.children[activeIndex] as HTMLElement
          if (segmentElement) {
            segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
    }
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isVideoPopupOpen, transcriptSegments])

  // Handle popup close - stop video
  const handlePopupClose = useCallback(() => {
    setIsVideoPopupOpen(false)
  }, [])

  // Open video popup
  const openVideoPopup = useCallback(() => {
    setIsVideoPopupOpen(true)
    setPopupCurrentTime(currentTime)
  }, [currentTime])

  // Mute toggle
  const toggleMute = useCallback(() => {
    const activeRef = isVideoPopupOpen ? fullVideoRef.current : miniVideoRef.current;
    if (activeRef) {
      activeRef.muted = !activeRef.muted
      setIsMuted(activeRef.muted)
    }
  }, [isVideoPopupOpen])

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
    <div className="w-[22rem] border-l border-border/50 hidden xl:flex xl:flex-col bg-background shadow-[-1px_0_10px_rgba(0,0,0,0.02)] z-10">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-12 flex">
          <TabsTrigger value="transcript" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground h-full font-semibold">Transkrip</TabsTrigger>
          {/* Only show Ask AI tab if user has permission */}
          {canAskAI && (
            <TabsTrigger value="ask-ai" className="flex-1 flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground h-full font-semibold">
              <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-600">AI</div>
              Ask AI
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="transcript" className="flex-1 flex flex-col overflow-hidden m-0">
          {isVideoFile && (
            <div className={`transition-all duration-300 ${isVideoPopupOpen ? 'fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-0' : 'p-4 bg-muted/10 border-b border-border/40'}`}>
              <div className={`relative overflow-hidden bg-black group shadow-md transition-all duration-300 ${isVideoPopupOpen ? 'w-full h-full max-h-screen' : 'rounded-2xl aspect-video ring-1 ring-border/50'}`}>
                {videoUrl && (
                  <video
                    ref={miniVideoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                  />
                )}
                
                {/* Subtitle Overlay for Mini Player */}
                {subtitlesEnabled && currentMiniSegment && (
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center px-8 pointer-events-none z-20">
                    <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-full text-center text-sm font-medium leading-relaxed drop-shadow-md">
                      {currentMiniSegment.text}
                    </div>
                  </div>
                )}
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Progress Bar */}
                  <div 
                    className="w-full bg-white/20 rounded-full cursor-pointer group/bar mb-2.5 h-1.5 transition-all hover:h-2"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const percent = (e.clientX - rect.left) / rect.width
                      if (miniVideoRef.current) {
                        miniVideoRef.current.currentTime = percent * totalDuration
                      }
                    }}
                  >
                    <div 
                      className="relative h-full rounded-full bg-primary"
                      style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 shadow-md scale-0 group-hover/bar:scale-100 transition-all duration-200" />
                    </div>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={togglePlayPause}
                        className="hover:bg-white/20 rounded-full transition-colors p-1.5"
                      >
                        {isPlaying ? (
                          <IconPlayerPause className="h-4 w-4" />
                        ) : (
                          <IconPlayerPlay className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        onClick={toggleMute}
                        className="hover:bg-white/20 rounded-full transition-colors p-1.5"
                      >
                        {isMuted ? (
                          <IconVolume3 className="h-4 w-4" />
                        ) : (
                          <IconVolume className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-[10px] font-medium opacity-80 ml-1 tabular-nums">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                        className={`hover:bg-white/20 rounded-full transition-colors p-1.5 relative ${subtitlesEnabled ? 'text-white' : 'text-white/50'}`}
                        title={subtitlesEnabled ? "Nonaktifkan Subtitle" : "Aktifkan Subtitle"}
                      >
                        <IconSubtitles className="h-5 w-5" />
                        {!subtitlesEnabled && (
                          <span className="absolute w-0.5 h-5 bg-current rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </button>
                      <button 
                        onClick={() => setIsVideoPopupOpen(!isVideoPopupOpen)}
                        className="hover:bg-white/20 rounded-full transition-colors p-1.5 text-white/80 hover:text-white"
                        title={isVideoPopupOpen ? "Perkecil Video" : "Perbesar Video"}
                      >
                        {isVideoPopupOpen ? <IconMinimize className="h-5 w-5" /> : <IconMaximize className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 py-4 space-y-3 bg-background relative z-10 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari dalam transkrip..." 
                className="pl-9 bg-muted/40 border-border/50 h-10 text-sm rounded-xl focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoFollow(!autoFollow)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  autoFollow ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${autoFollow ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`}></div>
                {autoFollow ? "Auto-scroll Aktif" : "Auto-scroll Nonaktif"}
              </button>
            </div>
          </div>

          <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto px-4 space-y-4 pb-24 pt-4 bg-muted/10">
            {(searchQuery ? filteredSegments : transcriptSegments).length > 0 ? (
              (searchQuery ? filteredSegments : transcriptSegments).map((segment, index) => {
                // Find the absolute index so active state works even during search
                const absoluteIndex = transcriptSegments.findIndex((s) => s.start === segment.start)
                const isActive = activeSegmentIndex === absoluteIndex 
                
                // Deterministic color logic for speakers based on first letter
                const speakerChar = segment.speaker ? segment.speaker.charAt(segment.speaker.length - 1).toUpperCase() : 'S'
                const isSystemSpeaker = /^SPEAKER/i.test(segment.speaker)
                
                return (
                  <div 
                    key={index} 
                    className={`group cursor-pointer rounded-xl p-3 transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isActive 
                        ? 'border-2 border-primary shadow-md bg-primary/10' 
                        : 'border-2 border-border bg-card hover:border-primary/30'
                    }`}
                    onClick={() => jumpToTimestamp(segment.start)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        isActive ? 'bg-primary' : 'bg-emerald-500'
                      }`}>
                        {speakerChar}
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
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground/70"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditSpeaker(index, segment.speaker)
                                }}
                              >
                                <IconPencil className="h-3.5 w-3.5 currentColor" />
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
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <IconMessage className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Tidak ada transkrip ditemukan</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ask-ai" className="flex-1 flex flex-col m-0 overflow-hidden">
          <AskAI meetingId={meetingId} userRole={userRole} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditingSpeaker} onOpenChange={setIsEditingSpeaker}>
        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-b from-primary/10 to-background px-6 py-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <IconUser className="w-5 h-5 text-primary" />
              Edit Nama Pembicara
            </DialogTitle>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="speaker-name" className="text-sm font-semibold">Nama Baru</Label>
              <Input
                id="speaker-name"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                placeholder="Contoh: John Doe"
                className="h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-scope" className="text-sm font-semibold">Cakupan Pembaruan</Label>
              <div className="relative">
                <Select value={updateScope} onValueChange={(val) => setUpdateScope(val as 'single' | 'all')}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-input focus:ring-primary/20 focus:ring-2 focus:outline-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="single" className="rounded-lg">Hanya percakapan ini saja</SelectItem>
                    <SelectItem value="all" className="rounded-lg">Semua percakapan dari "{editingSegment?.name}"</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {updateScope === 'all' && (
              <div className="text-[11px] text-primary bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-start gap-2">
                <IconInfoCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Opsi ini akan mengubah nama pembicara secara otomatis pada seluruh transkrip percakapan.</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border/50 sm:justify-between">
            <Button variant="outline" onClick={() => setIsEditingSpeaker(false)} disabled={isSubmitting} className="rounded-xl">Batal</Button>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 rounded-xl px-6 font-semibold shadow-sm"
              disabled={isSubmitting || !newSpeakerName.trim()}
              onClick={submitSpeakerUpdate}
            >
              {isSubmitting ? <IconReload className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
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
                  ref={fullVideoRef}
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
                    if (fullVideoRef.current) {
                      fullVideoRef.current.currentTime = percent * totalDuration
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
                      <IconSubtitles className="h-5 w-5" />
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
                        popupClickedTimeRef.current = segment.start
                        setPopupCurrentTime(segment.start)
                        jumpToTimestamp(segment.start)
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
