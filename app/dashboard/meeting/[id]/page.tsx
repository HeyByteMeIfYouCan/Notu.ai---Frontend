"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApiWithAuth, useAuth } from "@/hooks/use-auth"
import { getSocket } from "@/lib/socket"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

// Components
import { MeetingHeader } from "./components/MeetingHeader"
import { MeetingAnalytics } from "./components/MeetingAnalytics"
import { MeetingMainContent } from "./components/MeetingMainContent"
import { MeetingTranscript } from "./components/MeetingTranscript"
import { PlaybackControls } from "./components/PlaybackControls"

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string
  
  const { api, isReady } = useApiWithAuth()
  const { user } = useAuth()
  
  const [meeting, setMeeting] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [actionItems, setActionItems] = useState<any[]>([])
  const [hasSyncedTasks, setHasSyncedTasks] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isVideoFile, setIsVideoFile] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null)
  const [autoFollow, setAutoFollow] = useState(true)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)

  const fetchMeeting = useCallback(async () => {
    if (!isReady || !meetingId) return
    try {
      setIsLoading(true)
      const response = await api.getMeeting(meetingId) as any
      if (response && response.meeting) {
        setMeeting(response.meeting)
        setAnalytics(response.analytics)
        setActionItems(response.actionItems)
        setHasSyncedTasks(!!response.hasSyncedTasks || !!response.meeting?.hasBoard)
        
        const mimetype = response.meeting.originalFile?.mimetype || ''
        const filename = response.meeting.originalFile?.originalName || ''
        const isVideo = mimetype.startsWith('video/') || filename.toLowerCase().endsWith('.mp4')
        setIsVideoFile(isVideo)
        
        const fUrl = response.fileUrl || response.meeting.fileUrl
        if (fUrl) {
          if (isVideo) {
            setVideoUrl(fUrl)
            setAudioUrl(fUrl) 
          } else {
            setAudioUrl(fUrl)
          }
        }
      }
    } catch (error: any) {
      toast.error("Gagal memuat data meeting")
      if (error.response?.status === 404) router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, meetingId, api, router])

  useEffect(() => {
    if (isReady) fetchMeeting()
  }, [isReady, fetchMeeting])

  // Socket: subscribe to meeting updates so collaborators list and metadata refresh in real-time
  useEffect(() => {
    if (!meetingId) return
    const socket = getSocket()
    socket.emit('join_meeting', meetingId)
    socket.on('meeting_updated', (payload: any) => {
      if (payload && payload.meeting && String(payload.meeting._id) === meetingId) {
        fetchMeeting()
      }
    })
    return () => {
      socket.emit('leave_meeting', meetingId)
      socket.off('meeting_updated')
    }
  }, [meetingId, getSocket])

  // Player logic
  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    const handleTimeUpdate = () => {
      const time = video?.currentTime || audio?.currentTime || 0
      setCurrentTime(time)
      if (meeting?.transcription?.segments) {
        const activeIndex = meeting.transcription.segments.findIndex(
          (seg: any) => seg.start <= time && seg.end >= time
        )
        if (activeIndex !== -1 && activeIndex !== activeSegmentIndex) {
          setActiveSegmentIndex(activeIndex)
          if (autoFollow && transcriptContainerRef.current && !searchQuery) {
            const segmentElement = transcriptContainerRef.current.children[activeIndex] as HTMLElement
            if (segmentElement) segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
    }
    const handleEnded = () => setIsPlaying(false)
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('ended', handleEnded)
    }
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
    }
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('ended', handleEnded)
      }
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [videoUrl, audioUrl, meeting?.transcription?.segments, autoFollow, activeSegmentIndex, searchQuery])

  const togglePlayPause = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      if (isPlaying) media.pause()
      else media.play()
      setIsPlaying(!isPlaying)
    }
  }

  const jumpToTimestamp = (seconds: number) => {
    const media = videoRef.current || audioRef.current
    if (media) {
      media.currentTime = seconds
      if (!isPlaying) {
        media.play()
        setIsPlaying(true)
      }
    }
  }

  const handleUpdateMeeting = async (data: { title?: string; description?: string }) => {
    try {
      await api.updateMeeting(meetingId, data)
      setMeeting((prev: any) => ({ ...prev, ...data }))
      toast.success("Meeting diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui meeting")
    }
  }

  const handleUpdateSpeaker = async (oldName: string, newName: string, segmentIndex: number, applyToAll: boolean) => {
    try {
      await api.updateSpeakerName(meetingId, { oldSpeakerName: oldName, newSpeakerName: newName, segmentIndex, applyToAll })
      fetchMeeting() // Refresh to get all updated segments
    } catch (error) {
      toast.error("Gagal memperbarui pembicara")
      throw error
    }
  }

  // Action handlers
  const handleGenerateShareLink = async () => {
    try {
      const res = await api.generateMeetingShareLink(meetingId)
      setShareToken(res.data.shareToken)
    } catch (error) { toast.error("Gagal generate link share") }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await api.updateMeetingCollaboratorRole(meetingId, userId, role)
      toast.success("Role diperbarui")
      fetchMeeting()
    } catch (error) { toast.error("Gagal perbarui role") }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.removeMeetingCollaborator(meetingId, userId)
      toast.success("Member dihapus")
      fetchMeeting()
    } catch (error) { toast.error("Gagal hapus member") }
  }

  const handleExport = async (format: any) => {
    try {
      const blob = await api.exportTranscript(meetingId, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'mp3' || format === 'mp4' 
        ? `${meeting.title}.${meeting.originalFile?.originalName?.split('.').pop() || format}`
        : `transcript-${meetingId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Download berhasil")
    } catch (error: any) { toast.error(error.message || "Gagal export") }
  }

  const handleUpdateContent = async (field: string, value: any) => {
    try {
      const updateData: any = {}
      if (field === 'executiveSummary') updateData.executiveSummary = value
      else if (field === 'highlights') updateData.highlights = value
      else if (field === 'conclusion') updateData.conclusion = value
      
      await api.updateMeeting(meetingId, updateData)
      await fetchMeeting()
      toast.success("Konten diperbarui")
    } catch (error) { toast.error("Gagal memperbarui konten") }
  }

  const handleGenerateKanban = async () => {
    try {
      toast.loading("Membuat Kanban board...")
      const res = await api.createBoardFromMeeting(meetingId)
      toast.dismiss()
      toast.success("Kanban board berhasil dibuat!")
      router.push(`/dashboard/kanban/${res.data._id}`)
    } catch (error) {
      toast.dismiss()
      toast.error("Gagal membuat Kanban board")
    }
  }

  const handleDeleteKanban = async () => {
    try {
      const raw = meeting?.boardId ?? actionItems[0]?.boardId ?? null
      let bid: string | null = null
      if (raw) {
        if (typeof raw === 'object') bid = raw._id ?? String(raw)
        else bid = String(raw)
      }
      if (!bid) return
      await api.deleteBoard(bid)
      toast.success("Kanban board dihapus")
      fetchMeeting()
    } catch (error) { toast.error("Gagal menghapus Kanban board") }
  }

  const handleRegenerateAi = async () => {
    try {
      toast.loading("Mengulangi analisis AI...")
      await api.regenerateAiNotes(meetingId)
      toast.dismiss()
      toast.success("Analisis AI diperbarui!")
      fetchMeeting()
    } catch (error) {
      toast.dismiss()
      toast.error("Gagal mengulangi analisis AI")
    }
  }

  const handleDeleteMeeting = async () => {
    try {
      await api.deleteMeeting(meetingId)
      toast.success("Meeting dihapus")
      router.push("/dashboard/meeting")
    } catch (error) { toast.error("Gagal menghapus meeting") }
  }

  // Formatter utils
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = Math.floor(s % 60)
    return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}` : `${m}:${ss.toString().padStart(2,'0')}`
  }

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = Math.floor(s % 60)
    return h > 0 ? `${h}j ${m}m ${ss}d` : `${m}m ${ss}d`
  }

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formatTimeOnly = (ds: string) => new Date(ds).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><IconLoader2 className="h-12 w-12 animate-spin text-[var(--primary)]" /></div>
  if (!meeting) return <div className="min-h-screen bg-white flex items-center justify-center">Meeting tidak ditemukan</div>

  const filteredSegments = meeting.transcription?.segments?.filter((s: any) => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-white flex flex-col h-screen overflow-hidden">
      <MeetingHeader 
        title={meeting.title}
        description={meeting.description || ""}
        meetingId={meetingId}
        shareToken={shareToken}
        user={user}
        userRole={meeting?.userRole}
        collaborators={meeting.collaborators}
        onGenerateShareLink={handleGenerateShareLink}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
        onExport={handleExport}
        onDeleteMeeting={handleDeleteMeeting}
        onUpdateMeeting={handleUpdateMeeting}
        isVideoFile={isVideoFile}
        audioUrl={audioUrl}
        summary={meeting.transcription?.summary || ""}
        meeting={meeting}
      />

      <div className="flex flex-1 overflow-hidden">
        <MeetingAnalytics 
          talkTime={analytics?.talkTime || []}
          topics={analytics?.topics || []}
          actionItems={actionItems}
          hasSyncedTasks={hasSyncedTasks}
          hasBoard={meeting?.hasBoard}
          onGenerateKanban={handleGenerateKanban}
          onDeleteKanban={handleDeleteKanban}
          boardId={meeting?.boardId}
          userRole={meeting?.userRole}
        />

        <MeetingMainContent 
          meeting={meeting}
                    userRole={meeting?.userRole}
          actionItems={actionItems}
          hasSyncedTasks={hasSyncedTasks}
          onUpdateMeeting={handleUpdateMeeting}
          onRegenerateAi={handleRegenerateAi}
          onGenerateKanban={handleGenerateKanban}
          onUpdateContent={handleUpdateContent}
          formatDate={formatDate}
          formatTimeOnly={formatTimeOnly}
          formatDuration={formatDuration}
        />

        <MeetingTranscript 
          transcriptSegments={meeting.transcription?.segments || []}
          filteredSegments={filteredSegments}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          autoFollow={autoFollow}
          setAutoFollow={setAutoFollow}
          activeSegmentIndex={activeSegmentIndex}
          jumpToTimestamp={jumpToTimestamp}
          formatTime={formatTime}
          currentTime={currentTime}
          totalDuration={meeting.duration || 0}
          videoUrl={videoUrl}
          videoRef={videoRef}
          isVideoFile={isVideoFile}
          isPlaying={isPlaying}
          togglePlayPause={togglePlayPause}
          transcriptContainerRef={transcriptContainerRef}
          onUpdateSpeaker={handleUpdateSpeaker}
        />
      </div>

      {(videoUrl || audioUrl) && (
        <PlaybackControls 
          currentTime={currentTime}
          totalDuration={meeting.duration || 0}
          isPlaying={isPlaying}
          isVideoFile={isVideoFile}
          togglePlayPause={togglePlayPause}
          jumpToTimestamp={jumpToTimestamp}
          formatTime={formatTime}
          videoRef={videoRef}
          audioRef={audioRef}
        />
      )}

      {audioUrl && !videoUrl && (
        <audio ref={audioRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      )}
    </div>
  )
}