"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconClock, IconCheck, IconX, IconAlertCircle, IconRefresh, IconEye, IconLoader2, IconChevronDown, IconChevronUp, IconSearch, IconFilter, IconDownload, IconSparkles, IconChevronLeft, IconChevronRight, IconTrash, IconRocket, IconMicrophone, IconUsers, IconRobot, IconDeviceFloppy, IconPlugConnected, IconMapPin } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { getSocket } from "@/lib/socket"
import { ModernPagination } from "@/components/custom/ModernPagination"

interface ProcessingLog {
  message: string
  timestamp: string
  progress?: number
  stage?: string
}

interface Meeting {
  _id: string
  title: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  processingProgress?: number
  processingLogs?: ProcessingLog[]
  processingStage?: string
  participants?: any[]
  description?: string
  userRole?: 'owner' | 'editor' | 'viewer' | string
  isUpload?: boolean
  actionItems?: any[]
  chunkingEnabled?: boolean
  totalChunks?: number
  currentChunk?: number
  originalFilename?: string
}

// Stage configuration for FILE UPLOAD workflow
const UPLOAD_PROCESSING_STAGES = [
  { key: 'starting', label: 'Memulai', icon: IconRocket, start: 0, end: 9 },
  { key: 'downloading', label: 'Memproses File', icon: IconDownload, start: 10, end: 19 },
  { key: 'transcribing', label: 'Transkripsi Audio', icon: IconMicrophone, start: 20, end: 69 },
  { key: 'diarization', label: 'Identifikasi Pembicara', icon: IconUsers, start: 70, end: 79 },
  { key: 'ai_analysis', label: 'Analisis AI', icon: IconRobot, start: 80, end: 89 },
  { key: 'saving', label: 'Menyimpan Hasil', icon: IconDeviceFloppy, start: 90, end: 99 },
  { key: 'completed', label: 'Selesai', icon: IconCheck, start: 100, end: 100 },
] as const

// Stage configuration for ONLINE MEETING (Bot) workflow - 4 stages
const ONLINE_MEETING_STAGES = [
  { key: 'bot_connecting', label: 'Menghubungkan Bot', icon: IconPlugConnected, start: 0, end: 19 },
  { key: 'bot_joining', label: 'Bergabung Meeting', icon: IconMapPin, start: 20, end: 39 },
  { key: 'bot_recording', label: 'Merekam & Transkripsi', icon: IconMicrophone, start: 40, end: 99 },
  { key: 'completed', label: 'Selesai', icon: IconCheck, start: 100, end: 100 },
] as const

// Helper to check if meeting is online meeting (uses bot)
function isOnlineMeeting(platform?: string): boolean {
  if (!platform) return false
  const onlinePlatforms = ['google meet', 'zoom', 'teams', 'microsoft teams', 'webex']
  return onlinePlatforms.includes(platform.toLowerCase())
}

// Get stages based on meeting type
function getStagesForMeeting(platform?: string) {
  return isOnlineMeeting(platform) ? ONLINE_MEETING_STAGES : UPLOAD_PROCESSING_STAGES
}

function getStageIndex(stage?: string, platform?: string): number {
  if (!stage) return -1
  const stages = getStagesForMeeting(platform)
  return stages.findIndex(s => s.key === stage)
}

function getStageBadge(stage?: string, platform?: string): { label: string; icon: any } | null {
  if (!stage) return null
  const stages = getStagesForMeeting(platform)
  const found = stages.find(s => s.key === stage)
  return found || null
}

// Calculate per-stage progress (0-100%) from global progress
function getStageProgress(globalProgress: number, stage?: string, platform?: string): number {
  if (!stage) return 0
  if (stage === 'completed') return 100
  
  const stages = getStagesForMeeting(platform)
  const stageConfig = stages.find(s => s.key === stage)
  if (!stageConfig) return 0
  
  const { start, end } = stageConfig
  if (globalProgress < start) return 0
  if (globalProgress > end) return 100
  
  // Calculate progress within this stage (end is inclusive)
  const range = end - start + 1
  const current = globalProgress - start
  return Math.min(100, Math.round((current / range) * 100))
}

export default function StatusMeetingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const meetingIdFromUrl = searchParams.get('id')
  
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { api, isReady } = useApiWithAuth()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [pageSize, setPageSize] = useState(10)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Since we use server-side filtering, we just use meetings
  const filteredMeetings = meetings;

  const toggleLogExpand = (meetingId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId)
      } else {
        newSet.add(meetingId)
      }
      return newSet
    })
  }

  const fetchMeetings = useCallback(async (page = currentPage) => {
    if (!isReady) return
    
    try {
      let typeParam = undefined;
      let platformParam = undefined;

      if (platformFilter !== 'all') {
        if (['google_meet', 'zoom'].includes(platformFilter)) {
          platformParam = platformFilter;
        } else {
          // 'upload' or 'realtime' are Types
          typeParam = platformFilter;
        }
      }

      const params: any = { 
        limit: pageSize, 
        page,
        // Pass filters to backend
        search: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeParam,
        platform: platformParam,
        // Status page should sort by pure latest, not pinned first
        sortByPinned: 'false'
      }
      
      // Note: Backend 'type' might map to 'platform' or 'type'. 
      // The backend controller uses `type` query param for `type` field.
      // But platformFilter seems to check `meeting.platform`. 
      // Checking backend controller again: uses `type` for meeting.type.
      // If we want to filter by platform, strictly speaking we need backend support or abuse 'type' if values overlap.
      // For now, let's pass it. If backend doesn't support 'platform' param, we might need client side filter for that specific one.
      // Looking at controller code: it supports 'type' field queries. Meeting has 'type' (upload/online) and 'platform' (Zoom/Meet).
      // Assuming platformFilter maps to meeting.platform, we should use a backend param for it? 
      // Controller doesn't explicitly look for 'platform' query.
      // Let's stick to client filtering for platform if needed, OR mostly likely status/search are the big ones.
      
      const response = await api.getMeetings(params)
      
      // Merge new data while preserving socket-updated processingLogs for recording meetings
      setMeetings(prev => {
        const newMeetings = response.meetings || []
        return newMeetings.map((newMeeting: Meeting) => {
          const existing = prev.find(m => m._id === newMeeting._id)
          
          // If meeting is recording and we have socket-updated processingLogs, preserve them
          if (existing && 
              (existing.status === 'recording' || existing.status === 'bot_joining') &&
              existing.processingLogs && 
              existing.processingLogs.length > (newMeeting.processingLogs?.length || 0)) {
            return {
              ...newMeeting,
              processingLogs: existing.processingLogs, // Preserve real-time socket updates
            }
          }
          
          return newMeeting
        })
      })
      
      if (response.pagination) {
        setPagination({
          total: response.pagination.totalItems || response.pagination.total || 0,
          pages: response.pagination.totalPages || 1
        })
      }
    } catch (error) {
      console.error("Error fetching meetings:", error)
      toast.error("Gagal memuat status meeting")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isReady, api, currentPage, pageSize, debouncedSearch, statusFilter, platformFilter])

  // Initial fetch and page change
  useEffect(() => {
    if (isReady) {
      fetchMeetings(currentPage)
    } else {
      setIsLoading(false)
    }
  }, [isReady, currentPage, fetchMeetings])

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Track last heartbeat for detecting hung workers
  const [lastHeartbeats, setLastHeartbeats] = useState<Map<string, Date>>(new Map())

  // Socket integration for real-time updates
  useEffect(() => {
    const socket = getSocket()

    // Listen for transcription progress updates
    socket.on('transcription_progress', ({ meetingId, progress, message, stage, chunking, totalChunks, chunk }) => {
      setMeetings(prev => prev.map(m => {
        if (m._id === meetingId) {
          // MONOTONIC GUARD: Only update if progress is forward (prevent backward progress)
          const currentProgress = m.processingProgress || 0
          const newProgress = progress ?? currentProgress
          if (newProgress < currentProgress && stage !== 'completed') {
            // Skip backward progress updates (except for completed which resets)
            console.log(`[Progress Guard] Skipping backward progress: ${currentProgress} -> ${newProgress}`)
            return m
          }
          
          const newLog: ProcessingLog = { message, timestamp: new Date().toISOString(), progress, stage }
          return {
            ...m,
            processingProgress: newProgress,
            processingStage: stage || m.processingStage,
            processingLogs: [...(m.processingLogs || []), newLog].slice(-15), // Keep last 15 logs
            // Add chunking info if available
            ...(chunking !== undefined && { chunkingEnabled: chunking }),
            ...(totalChunks !== undefined && { totalChunks }),
            ...(chunk !== undefined && { currentChunk: chunk })
          }
        }
        return m
      }))
      // Update heartbeat on any progress
      setLastHeartbeats(prev => new Map(prev).set(meetingId, new Date()))
    })

    // Listen for worker heartbeat (indicates worker is still alive)
    socket.on('worker_heartbeat', ({ meetingId, stage, timestamp }) => {
      setLastHeartbeats(prev => new Map(prev).set(meetingId, new Date(timestamp)))
    })

    // Listen for transcription completion
    socket.on('transcription_complete', ({ meetingId }) => {
      fetchMeetings()
      toast.success('Transcription completed!')
    })

    // Listen for transcription failure
    socket.on('transcription_failed', ({ meetingId, error }) => {
      fetchMeetings()
      toast.error(`Transcription failed: ${error}`)
    })

    // Listen for bot status updates
    socket.on('bot_status', ({ meetingId, status, message }) => {
      console.log('[Bot] Status update:', meetingId, status)
      setMeetings(prev => prev.map(m => {
        if (m._id === meetingId) {
          // Map bot status to meeting status and stage
          let newStatus = m.status
          let newStage = m.processingStage
          let newProgress = m.processingProgress || 0
          
          if (status === 'recording') {
            newStatus = 'recording'
            newStage = 'bot_recording'
            newProgress = 50
          } else if (status === 'completed') {
            newStatus = 'completed'
            newStage = 'completed'
            newProgress = 100
          } else if (status === 'leaving') {
            // Keep recording status while leaving
            newProgress = 90
          } else if (status === 'in_meeting') {
            newStatus = 'recording'
            newStage = 'bot_joining'
            newProgress = 40
          }
          
          return {
            ...m,
            status: newStatus,
            processingStage: newStage,
            processingProgress: newProgress,
          }
        }
        return m
      }))
      
      // Refresh meetings when completed to get full data
      if (status === 'completed') {
        setTimeout(() => fetchMeetings(), 1000)
      }
    })

    // Listen for live captions from bot
    socket.on('caption_added', ({ meetingId, segment }) => {
      console.log('[Bot] Caption:', meetingId, segment?.speaker, segment?.text?.substring(0, 50))
      setMeetings(prev => prev.map(m => {
        if (m._id === meetingId) {
          const captionText = `${segment.speaker}: ${segment.text}`
          const newLog = { 
            message: captionText, 
            timestamp: new Date().toISOString(), 
            stage: 'bot_recording' 
          }
          return {
            ...m,
            processingLogs: [...(m.processingLogs || []).slice(-10), newLog],
            description: captionText, // Show latest caption in description
          }
        }
        return m
      }))
    })

    // Also listen for global live_caption (for dashboard monitoring)
    socket.on('live_caption', ({ meetingId, segment }) => {
      console.log('[Bot] Live caption:', segment?.text?.substring(0, 30))
    })

    return () => {
      socket.off('transcription_progress')
      socket.off('worker_heartbeat')
      socket.off('transcription_complete')
      socket.off('transcription_failed')
      socket.off('bot_status')
      socket.off('caption_added')
      socket.off('live_caption')
    }
  }, [fetchMeetings])

  // Polling for active meetings
  useEffect(() => {
    // Poll list refresh (for status changes)
    const listInterval = setInterval(fetchMeetings, 15000) // Every 15 seconds

    // Poll progress for active meetings (more frequent)
    const activeMeetings = meetings.filter(m => 
      m.status === 'processing' || 
      m.status === 'uploading' || 
      m.status === 'pending' || 
      m.status === 'queued' ||
      m.status === 'recording' ||
      m.status === 'bot_joining'
    )
    let progressInterval: NodeJS.Timeout

    if (activeMeetings.length > 0) {
      progressInterval = setInterval(async () => {
        for (const m of activeMeetings) {
           try {
             const res = await api.getMeetingStatus(m._id)
             if (res.success && res.data) {
                setMeetings(prev => prev.map(pm => {
                  if (pm._id === m._id) {
                    // Get stage from latest log if available
                    const latestLog = res.data.processingLogs?.[res.data.processingLogs.length - 1]
                    const newProgress = res.data.job?.progress || 0
                    const currentProgress = pm.processingProgress || 0
                    
                    // MONOTONIC GUARD: Only update if progress is forward or status changed to completed/failed
                    const isStatusComplete = res.data.status === 'completed' || res.data.status === 'failed'
                    if (newProgress < currentProgress && !isStatusComplete) {
                      // Skip backward progress from polling (socket has more up-to-date data)
                      console.log(`[Polling Guard] Skipping backward progress for ${m._id}: ${currentProgress} -> ${newProgress}`)
                      return pm
                    }
                    
                    return {
                      ...pm,
                      status: res.data.status,
                      processingProgress: Math.max(newProgress, currentProgress),
                      processingStage: latestLog?.stage || res.data.processingStage || pm.processingStage,
                      processingLogs: res.data.processingLogs || pm.processingLogs || []
                    }
                  }
                  return pm
                }))
                
                // If finished, force full refresh
                if (res.data.status === 'completed' || res.data.status === 'failed') {
                   fetchMeetings()
                }
             }
           } catch (e) {
             console.error("Progress poll error", e)
           }
        }
      }, 5000) // Every 5 seconds for processing meetings
    }

    return () => {
      clearInterval(listInterval)
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [meetings, fetchMeetings, api])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchMeetings()
  }

  const handleRetry = async (meetingId: string) => {
    try {
      await api.retryTranscription(meetingId)
      toast.success("Transkripsi ulang dimulai")
      fetchMeetings()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal memulai ulang transkripsi")
    }
  }

  const handleViewSummary = (meetingId: string) => {
    router.push(`/dashboard/meeting/${meetingId}`)
  }

  const handleDelete = async (meetingId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus meeting ini?")) return
    
    setDeletingId(meetingId)
    try {
      await api.deleteMeeting(meetingId)
      setMeetings(prev => prev.filter(m => m._id !== meetingId))
      toast.success("Meeting berhasil dihapus")
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus meeting")
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15"><IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
      case "bot_joining":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15 animate-pulse"><IconLoader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-spin" /></div>
      case "recording":
      case "processing":
      case "uploading":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 animate-pulse"><IconLoader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" /></div>
      case "pending":
      case "queued":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15"><IconClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
      case "cancelled":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><IconX className="h-5 w-5 text-muted-foreground" /></div>
      case "failed":
      case "error":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15"><IconAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
      default:
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><IconClock className="h-5 w-5 text-muted-foreground" /></div>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 hover:bg-green-500/25">Selesai</Badge>
      case "bot_joining":
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-0 animate-pulse flex items-center gap-1.5 hover:bg-purple-500/25"><IconLoader2 className="h-3 w-3 animate-spin" />Bot Bergabung</Badge>
      case "recording":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0 animate-pulse hover:bg-blue-500/25">Merekam</Badge>
      case "processing":
        return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-0 animate-pulse hover:bg-orange-500/25">Memproses</Badge>
      case "uploading":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0 hover:bg-blue-500/25">Mengunggah</Badge>
      case "pending":
      case "queued":
        return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0 flex items-center gap-1.5 hover:bg-yellow-500/25"><IconLoader2 className="h-3 w-3 animate-spin" />Memproses...</Badge>
      case "cancelled":
        return <Badge className="bg-muted text-muted-foreground border-0">Dibatalkan</Badge>
      case "failed":
      case "error":
        return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-0 hover:bg-red-500/25">Gagal</Badge>
      default:
        return <Badge variant="secondary">{status || 'Menunggu'}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes} min`
  }

  const statusCounts = {
    completed: meetings.filter(m => m.status === "completed").length,
    active: meetings.filter(m => m.status === "recording" || m.status === "processing" || m.status === "uploading" || (m.status === "pending" && (m.processingProgress || m.processingLogs?.length))).length,
    pending: meetings.filter(m => m.status === "pending" && !m.processingProgress && !m.processingLogs?.length).length,
    cancelled: meetings.filter(m => m.status === "cancelled").length,
    failed: meetings.filter(m => m.status === "failed").length
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                      Status Meeting
                    </h1>
                    <p className="text-sm text-muted-foreground">Monitor dan lacak progres meeting secara real-time</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="border-border hover:bg-accent bg-background-2 hover:text-accent-foreground transition-all"
                  >
                    <IconRefresh className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              {/* Filters */}
              <div className="px-4 lg:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-[400px]">
                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search meetings..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-background-2">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Sedang Berjalan</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="failed">Gagal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-[180px] bg-background-2">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Platform</SelectItem>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
                      <SelectItem value="realtime">Realtime (Mic)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={pageSize.toString()} onValueChange={(val) => {
                    setPageSize(Number(val))
                    setCurrentPage(1) // Reset to first page when changing page size
                  }}>
                    <SelectTrigger className="w-[130px] bg-background-2">
                      <SelectValue placeholder="10 / page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 / page</SelectItem>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                  </Select>

                  {(searchQuery || statusFilter !== "all" || platformFilter !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setStatusFilter("all")
                        setPlatformFilter("all")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Pagination Controls - Removed from top */}

              {/* Status Overview */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Selesai</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
                        <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.completed}</div>
                      <p className="text-xs text-muted-foreground mt-1">Meeting selesai</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Aktif</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 animate-pulse">
                        <IconLoader2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.active}</div>
                      <p className="text-xs text-muted-foreground mt-1">Sedang diproses</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Menunggu</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/15">
                        <IconClock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.pending}</div>
                      <p className="text-xs text-muted-foreground mt-1">Dalam antrian</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Dibatalkan</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <IconX className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-muted-foreground">{statusCounts.cancelled}</div>
                      <p className="text-xs text-muted-foreground mt-1">Meeting dibatalkan</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Gagal</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                        <IconAlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.failed}</div>
                      <p className="text-xs text-muted-foreground mt-1">Error teknis</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Meeting List */}
              <div className="px-4 lg:px-6">
                <h2 className="text-lg font-semibold mb-4">
                  {statusFilter !== "all" || platformFilter !== "all" || searchQuery 
                    ? "Filtered Meetings" 
                    : "All Meetings"}
                </h2>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                      <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    {meetings.length === 0 ? (
                      <>
                        <p className="text-lg font-medium text-foreground">Belum ada meeting</p>
                        <p className="text-sm text-muted-foreground mt-1">Mulai dengan membuat meeting baru</p>
                      </>
                    ) : (
                      <>
                        <IconFilter className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No meetings found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery("")
                            setStatusFilter("all")
                            setPlatformFilter("all")
                          }}
                        >
                          Clear all filters
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {filteredMeetings.map((meeting) => (
                        <Card 
                          key={meeting._id} 
                          className={`group border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300 ${
                          meetingIdFromUrl === meeting._id ? 'ring-2 ring-primary shadow-lg' : ''
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            {/* Status Icon */}
                            <div className="shrink-0">
                              {getStatusIcon(meeting.status)}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 space-y-4">
                              {/* Header */}
                              <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                                  {meeting.title || 'Untitled Meeting'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <IconClock className="h-3.5 w-3.5" />
                                    {formatDate(meeting.createdAt)}
                                  </span>
                                  {meeting.duration && (
                                    <span className="flex items-center gap-1.5">
                                      <IconSparkles className="h-3.5 w-3.5" />
                                      {formatDuration(meeting.duration)}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
                                    {meeting.platform || 'Upload'}
                                  </span>
                                  {meeting.actionItems && meeting.actionItems.length > 0 && (
                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                      {meeting.actionItems.length} action items
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {meeting.description && meeting.status === 'completed' && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                  {meeting.description}
                                </p>
                              )}

                              {/* File Info for Processing */}
                              {(meeting.status === 'processing' || meeting.status === 'uploading' || meeting.status === 'pending' || meeting.status === 'queued') && meeting.originalFilename && (
                                <p className="text-xs text-muted-foreground">
                                  📁 {meeting.originalFilename}
                                </p>
                              )}

                              {/* Processing Progress - Visual Stage Stepper */}
                              {(meeting.status === 'processing' || meeting.status === 'uploading' || meeting.status === 'pending' || meeting.status === 'queued' || meeting.status === 'recording') && (
                                <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                                  {/* Stage Stepper - Visual Steps - Dynamic based on meeting type */}
                                  <div className="flex items-center justify-between gap-1">
                                    {(() => {
                                      const stages = getStagesForMeeting(meeting.platform)
                                      const currentStageIdx = getStageIndex(meeting.processingStage, meeting.platform)
                                      return stages.slice(0, -1).map((stage, idx) => {
                                        const isCompleted = idx < currentStageIdx
                                        const isCurrent = idx === currentStageIdx
                                        const isPending = idx > currentStageIdx
                                      
                                        return (
                                          <div key={stage.key} className="flex items-center flex-1">
                                            {/* Stage Circle with Individual Tooltip */}
                                            <div className="flex flex-col items-center relative group/stage">
                                              {/* Icon with enhanced styling */}
                                              <div 
                                                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 cursor-help ${
                                                  isCompleted 
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:scale-110' 
                                                    : isCurrent 
                                                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg animate-pulse ring-2 ring-primary/30 hover:scale-110' 
                                                      : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground hover:from-muted/80 hover:to-muted hover:scale-105'
                                                }`}
                                              >
                                                {/* Glow effect for current stage */}
                                                {isCurrent && (
                                                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
                                                )}
                                                <span className="relative z-10 flex items-center justify-center">
                                                  {isCompleted ? <IconCheck className="w-5 h-5" /> : <stage.icon className="w-5 h-5" />}
                                                </span>
                                              </div>
                                            
                                              {/* Tooltip - appears on THIS icon hover only */}
                                              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl border border-border opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                                                {/* Tooltip arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-base flex items-center"><stage.icon className="w-4 h-4" /></span>
                                                  <span className="font-medium">{stage.label}</span>
                                                  {isCompleted && <span className="text-green-500 font-bold">✓</span>}
                                                  {isCurrent && <span className="text-primary font-bold">(aktif)</span>}
                                                </div>
                                              </div>
                                            
                                              {/* Stage Label - Only show for current */}
                                              {isCurrent && (
                                                <span className="text-[10px] text-primary font-semibold mt-1.5 whitespace-nowrap">
                                                  {stage.label}
                                                </span>
                                              )}
                                            </div>
                                            {/* Connector Line */}
                                            {idx < stages.length - 2 && (
                                              <div 
                                                className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${
                                                  isCompleted ? 'bg-green-500' : 'bg-muted'
                                                }`}
                                              />
                                            )}
                                          </div>
                                        )
                                      })
                                    })()}
                                  </div>

                                  {/* Current Stage Details */}
                                  {meeting.processingStage && getStageBadge(meeting.processingStage, meeting.platform) && (
                                    <div className="pt-2 border-t border-border/50">
                                      {/* Progress within current stage */}
                                      {meeting.processingStage !== 'completed' && (
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                              {(() => {
                                                const badge = getStageBadge(meeting.processingStage, meeting.platform)
                                                // @ts-ignore
                                                const Icon = badge?.icon
                                                return Icon ? <Icon className="w-4 h-4" /> : null
                                              })()}
                                              <span>{getStageBadge(meeting.processingStage, meeting.platform)?.label}</span>
                                              {meeting.processingStage === 'transcribing' && meeting.totalChunks && meeting.totalChunks > 1 && (
                                                <span className="ml-1 text-primary font-medium">({meeting.currentChunk || 0}/{meeting.totalChunks})</span>
                                              )}
                                            </span>
                                            <span className="font-bold text-primary">
                                              {meeting.processingProgress || 0}%
                                            </span>
                                          </div>
                                          {/* Global progress bar */}
                                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                              style={{ width: `${meeting.processingProgress || 0}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Current Message */}
                                      {meeting.processingLogs && meeting.processingLogs.length > 0 && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                                          {meeting.processingStage !== 'completed' ? (
                                            <IconLoader2 className="h-3 w-3 animate-spin shrink-0" />
                                          ) : (
                                            <span className="shrink-0">✓</span>
                                          )}
                                          {meeting.processingLogs[meeting.processingLogs.length - 1].message}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Live Transcript Display - Only for recording/online meetings */}
                                  {meeting.status === 'recording' && meeting.processingLogs && meeting.processingLogs.length > 0 && (
                                    <div className="mt-3 p-3 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg border border-green-200/50 dark:border-green-800/50">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">📝 Live Transcript</p>
                                      </div>
                                      <div className="max-h-24 overflow-y-auto space-y-1">
                                        {(() => {
                                          const logs = meeting.processingLogs.slice(-5)
                                          return logs.map((log, i) => {
                                            const isNewest = i === logs.length - 1
                                            return (
                                              <p 
                                                key={i} 
                                                className={isNewest 
                                                  ? "text-sm font-medium text-primary border-l-2 border-primary pl-2 bg-primary/5 py-0.5 rounded-r" 
                                                  : "text-sm text-muted-foreground leading-relaxed pl-2"}
                                              >
                                                {log.message}
                                              </p>
                                            )
                                          })
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row lg:flex-col items-center gap-3 shrink-0">
                              {getStatusBadge(meeting.status)}
                              {meeting.status === "completed" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleViewSummary(meeting._id)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                                >
                                  <IconEye className="h-4 w-4 mr-2" />
                                  Lihat Detail
                                </Button>
                              )}
                              {meeting.status === "failed" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleRetry(meeting._id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  <IconRefresh className="h-4 w-4 mr-2" />
                                  Coba Lagi
                                </Button>
                              )}
                              {/* Delete - Owner/Admin only */}
                              {(meeting.userRole === 'owner' || meeting.userRole === 'admin') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDelete(meeting._id)}
                                  disabled={deletingId === meeting._id}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  {deletingId === meeting._id ? (
                                    <IconLoader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <IconTrash className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  </>
                )}

                {/* Pagination */}
                <ModernPagination
                  currentPage={currentPage}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={pageSize}
                  onPageChange={handlePageChange}
                  className="px-0 mt-4"
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
