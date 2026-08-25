"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApiWithAuth, useAuth } from "@/hooks/use-auth"
import { getSocket } from "@/lib/socket"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

// Components
import { MeetingHeader } from "./components/MeetingHeader"
import { MeetingAnalytics } from "./components/MeetingAnalytics"
import { MeetingMainContent } from "./components/MeetingMainContent"
import { MeetingTranscript } from "./components/MeetingTranscript"
import { PlaybackControls } from "./components/PlaybackControls"
import { RealtimeBanner } from "./components/RealtimeBanner"
import type { Collaborator, CollaboratorRole, Meeting, TaskCandidate, TranscriptionSegment, User } from "@/lib/types"

// Types for socket events and analytics
interface MeetingUpdateEvent {
  meeting: Meeting
  updatedBy: { _id: string; name: string }
  field?: string
  action?: string
}

interface TalkTimeItem {
  speaker: string
  words: number
  talks: number
  total: number
}

interface TopicItem {
  name: string
  color: string
}

interface MeetingDetailAnalytics {
  talkTime: TalkTimeItem[]
  topics: TopicItem[]
}

interface GetMeetingApiResponse {
  meeting?: Meeting
  analytics?: MeetingDetailAnalytics
  actionItems?: TaskCandidate[]
  hasSyncedTasks?: boolean
  fileUrl?: string
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string
  
  const { api, isReady } = useApiWithAuth()
  const { user } = useAuth()
  
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [analytics, setAnalytics] = useState<MeetingDetailAnalytics | null>(null)
  const [actionItems, setActionItems] = useState<TaskCandidate[]>([])
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
  const [mediaDuration, setMediaDuration] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)

  const fetchMeeting = useCallback(async () => {
    if (!isReady || !meetingId) return
    try {
      setIsLoading(true)
      const response = await api.getMeeting(meetingId) as unknown as GetMeetingApiResponse
      if (response && response.meeting) {
        setMeeting(response.meeting)
        setAnalytics(response.analytics || null)
        setActionItems(response.actionItems || [])
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
    } catch (error: unknown) {
      toast.error("Gagal memuat data meeting")
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, meetingId, api, router])

  useEffect(() => {
    if (isReady) fetchMeeting()
  }, [isReady, fetchMeeting])

  // Socket: subscribe to meeting updates for realtime collaboration
  useEffect(() => {
    if (!meetingId) return
    const socket = getSocket()
    
    // Join meeting room
    socket.emit('join_meeting', meetingId)
    
    // Handle meeting updated event (title, description, etc.)
    const handleMeetingUpdated = (payload: MeetingUpdateEvent) => {
      if (!payload?.meeting || String(payload.meeting._id) !== meetingId) return
      
      // Don't show toast for own updates
      if (payload.updatedBy?._id !== user?.id) {
        const fieldLabel = payload.field === 'title' ? 'judul' : 
                          payload.field === 'description' ? 'deskripsi' :
                          payload.field === 'speaker' ? 'nama pembicara' : 'konten'
        toast.info(`${payload.updatedBy?.name || 'Seseorang'} memperbarui ${fieldLabel}`, {
          duration: 3000,
        })
      }
      
      fetchMeeting()
    }
    
    // Handle AI regeneration
    const handleAiRegenerated = (payload: { meetingId?: string; regeneratedBy?: { _id?: string; name?: string } }) => {
      if (payload?.meetingId !== meetingId) return
      
      if (payload.regeneratedBy?._id !== user?.id) {
        toast.info(`${payload.regeneratedBy?.name || 'Seseorang'} membuat ulang analisis AI`, {
          duration: 3000,
        })
      }
      
      fetchMeeting()
    }
    
    // Handle action item sync
    const handleActionItemSynced = (payload: { meetingId?: string; syncedBy?: { _id?: string; name?: string } }) => {
      if (payload?.meetingId !== meetingId) return
      
      if (payload.syncedBy?._id !== user?.id) {
        toast.info(`${payload.syncedBy?.name || 'Seseorang'} membuat Kanban board`, {
          duration: 3000,
        })
      }
      
      fetchMeeting()
    }
    
    // Handle collaborator changes
    const handleCollaboratorAdded = (payload: { meetingId?: string; user?: { name?: string } }) => {
      if (payload?.meetingId !== meetingId) return
      toast.success(`${payload.user?.name || 'Seseorang'} bergabung ke meeting`, {
        duration: 3000,
      })
      fetchMeeting()
    }
    
    const handleCollaboratorRemoved = (payload: { meetingId?: string; userId?: string }) => {
      if (payload?.meetingId !== meetingId) return
      
      // If current user was removed, redirect
      if (payload.userId === user?.id) {
        toast.error('Akses Anda ke meeting ini telah dicabut')
        router.push('/dashboard/meeting')
        return
      }
      
      fetchMeeting()
    }
    
    // Handle role changes
    const handleCollaboratorRoleChanged = (payload: { resourceId?: string; userId?: string; newRole?: string }) => {
      if (payload?.resourceId !== meetingId) return
      
      // If current user's role was changed, refetch and show notification
      if (payload.userId === user?.id) {
        toast.info(`Akses Anda sekarang ${payload.newRole}`, {
          duration: 4000,
        })
        fetchMeeting()
      } else {
        fetchMeeting()
      }
    }
    
    socket.on('meeting_updated', handleMeetingUpdated)
    socket.on('meeting_ai_regenerated', handleAiRegenerated)
    socket.on('meeting_action_synced', handleActionItemSynced)
    socket.on('meeting_collaborator_added', handleCollaboratorAdded)
    socket.on('meeting_collaborator_removed', handleCollaboratorRemoved)
    socket.on('collaborator_role_changed', handleCollaboratorRoleChanged)
    
    return () => {
      socket.emit('leave_meeting', meetingId)
      socket.off('meeting_updated', handleMeetingUpdated)
      socket.off('meeting_ai_regenerated', handleAiRegenerated)
      socket.off('meeting_action_synced', handleActionItemSynced)
      socket.off('meeting_collaborator_added', handleCollaboratorAdded)
      socket.off('meeting_collaborator_removed', handleCollaboratorRemoved)
      socket.off('collaborator_role_changed', handleCollaboratorRoleChanged)
    }
  }, [meetingId, user?.id, fetchMeeting, router])

  // Player logic - Track current time and active segment
  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    
    const handleTimeUpdate = () => {
      const time = video?.currentTime || audio?.currentTime || 0
      setCurrentTime(time)
      
      // Update active segment based on current time
      if (meeting?.transcription?.segments && meeting.transcription.segments.length > 0) {
        const activeIndex = meeting.transcription.segments.findIndex(
          (seg: any) => (seg.start - 0.5) <= time && (seg.end + 0.5) >= time
        )
        
        // Update active segment index whenever it changes
        if (activeIndex !== -1) {
          setActiveSegmentIndex(activeIndex)
          
          // Auto-scroll to active segment if enabled
          if (autoFollow && transcriptContainerRef.current && !searchQuery) {
            const segmentElement = transcriptContainerRef.current.children[activeIndex] as HTMLElement
            if (segmentElement) {
              segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        }
      }
    }
    
    const handleEnded = () => setIsPlaying(false)
    
    // Get actual duration from media element when metadata loads
    const handleLoadedMetadata = () => {
      const duration = video?.duration || audio?.duration || 0
      if (duration && isFinite(duration) && duration > 0) {
        setMediaDuration(duration)
      }
    }
    
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      // If already loaded, get duration immediately
      if (video.duration && isFinite(video.duration)) {
        setMediaDuration(video.duration)
      }
    }
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      // If already loaded, get duration immediately
      if (audio.duration && isFinite(audio.duration)) {
        setMediaDuration(audio.duration)
      }
    }
    
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [videoUrl, audioUrl, meeting?.transcription?.segments, autoFollow, searchQuery])

  const togglePlayPause = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      // Sync media time with state before toggling
      if (Math.abs(media.currentTime - currentTime) > 0.5) {
        media.currentTime = currentTime
      }
      
      if (isPlaying) {
        media.pause()
        setIsPlaying(false)
      } else {
        media.play().catch(err => console.error('Play failed:', err))
        setIsPlaying(true)
      }
    }
  }

  const jumpToTimestamp = (seconds: number) => {
    const media = videoRef.current || audioRef.current
    if (media) {
      media.currentTime = seconds
      setCurrentTime(seconds)  // Sync state immediately
      if (!isPlaying) {
        media.play().catch(err => console.error('Play failed:', err))
        setIsPlaying(true)
      }
    }
  }

  const handleUpdateMeeting = async (data: { title?: string; description?: string }) => {
    try {
      await api.updateMeeting(meetingId, data)
      setMeeting(prev => prev ? { ...prev, ...data } : null)
      toast.success("Meeting diperbarui")
    } catch (error: unknown) {
      toast.error("Gagal memperbarui meeting")
    }
  }

  const handleUpdateSpeaker = async (oldName: string, newName: string, segmentIndex: number, applyToAll: boolean) => {
    try {
      await api.updateSpeakerName(meetingId, { oldSpeakerName: oldName, newSpeakerName: newName, segmentIndex, applyToAll })
      fetchMeeting()
    } catch (error: unknown) {
      toast.error("Gagal memperbarui pembicara")
      throw error
    }
  }

  // Action handlers
  const handleGenerateShareLink = async () => {
    try {
      const res = await api.generateMeetingShareLink(meetingId)
      setShareToken(res.data.shareToken)
    } catch (error: unknown) {
      toast.error("Gagal generate link share")
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await api.updateMeetingCollaboratorRole(meetingId, userId, role)
      toast.success("Role diperbarui")
      fetchMeeting()
    } catch (error: unknown) {
      toast.error("Gagal perbarui role")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.removeMeetingCollaborator(meetingId, userId)
      toast.success("Member dihapus")
      fetchMeeting()
    } catch (error: unknown) {
      toast.error("Gagal hapus member")
    }
  }

  const handleExport = async (format: 'json' | 'txt' | 'srt' | 'vtt' | 'mp3' | 'mp4') => {
    if (!meeting) return
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Gagal export"
      toast.error(msg)
    }
  }

  const handleUpdateContent = async (field: string, value: string | Record<string, string>) => {
    try {
      const updateData: Record<string, string | Record<string, string>> = {}
      if (field === 'executiveSummary') updateData.executiveSummary = value
      else if (field === 'highlights') updateData.highlights = value
      else if (field === 'conclusion') updateData.conclusion = value
      
      await api.updateMeeting(meetingId, updateData)
      await fetchMeeting()
      toast.success("Konten diperbarui")
    } catch (error: unknown) {
      toast.error("Gagal memperbarui konten")
    }
  }

  const handleGenerateKanban = async () => {
    try {
      toast.loading("Membuat Kanban board...")
      const res = await api.createBoardFromMeeting(meetingId)
      toast.dismiss()
      toast.success("Kanban board berhasil dibuat!")
      router.push(`/dashboard/kanban/${res.data._id}`)
    } catch (error: unknown) {
      toast.dismiss()
      toast.error("Gagal membuat Kanban board")
    }
  }

  const handleDeleteKanban = async () => {
    try {
      const bid = meeting?.boardId || actionItems[0]?.boardId || null
      if (!bid) return
      await api.deleteBoard(String(bid))
      toast.success("Kanban board dihapus")
      fetchMeeting()
    } catch (error: unknown) {
      toast.error("Gagal menghapus Kanban board")
    }
  }

  const handleRegenerateAi = async () => {
    try {
      toast.loading("Mengulangi analisis AI...")
      await api.regenerateAiNotes(meetingId)
      toast.dismiss()
      toast.success("Analisis AI diperbarui!")
      fetchMeeting()
    } catch (error: unknown) {
      toast.dismiss()
      toast.error("Gagal mengulangi analisis AI")
    }
  }

  const handleDeleteMeeting = async () => {
    try {
      await api.deleteMeeting(meetingId)
      toast.success("Meeting dihapus")
      router.push("/dashboard/meeting")
    } catch (error: unknown) {
      toast.error("Gagal menghapus meeting")
    }
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

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><IconLoader2 className="h-12 w-12 animate-spin text-primary" /></div>
  if (!meeting) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Meeting tidak ditemukan</div>

  const filteredSegments = meeting.transcription?.segments?.filter((s: TranscriptionSegment) => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar className="z-[100]" />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
          <RealtimeBanner 
            meetingId={meetingId}
            currentUserName={user?.name}
            onRefresh={fetchMeeting}
          />
          
          <MeetingHeader 
            title={meeting.title}
            description={meeting.description || ""}
            meetingId={meetingId}
            shareToken={shareToken}
            user={user}
            userRole={meeting?.userRole}
            collaborators={meeting.collaborators}
            participants={meeting.participants}
            onGenerateShareLink={handleGenerateShareLink}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
            onExport={handleExport}
            onDeleteMeeting={handleDeleteMeeting}
            onUpdateMeeting={handleUpdateMeeting}
            isVideoFile={isVideoFile}
            audioUrl={audioUrl}
            summary={meeting.transcription?.summary || ""}
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
              meetingId={meetingId}
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
              meetingId={meetingId}
              userRole={meeting.userRole}
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
              totalDuration={mediaDuration || meeting.duration || 0}
              videoUrl={videoUrl}
              audioRef={audioRef}
              videoRef={videoRef}
              isVideoFile={isVideoFile}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              togglePlayPause={togglePlayPause}
              transcriptContainerRef={transcriptContainerRef}
              onUpdateSpeaker={handleUpdateSpeaker}
              meeting={meeting}
              collaborators={meeting.collaborators}
              user={user}
            />
          </div>

          {(videoUrl || audioUrl) && (
            <PlaybackControls 
              currentTime={currentTime}
              totalDuration={mediaDuration || meeting.duration || 0}
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
      </SidebarInset>
    </SidebarProvider>
  )
}
