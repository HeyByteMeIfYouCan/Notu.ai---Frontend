"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
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
import { IconClock, IconCheck, IconX, IconAlertCircle, IconRefresh, IconEye, IconLoader2, IconChevronDown, IconChevronUp, IconSearch, IconFilter, IconDownload, IconSparkles } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { getSocket } from "@/lib/socket"

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
  summary?: string
  userRole?: 'owner' | 'editor' | 'viewer' | string
  summarySnippet?: string
  isUpload?: boolean
  actionItems?: any[]
}

// Stage configuration for visual display
const PROCESSING_STAGES = [
  { key: 'starting', label: 'Memulai', icon: '🚀', color: 'from-blue-400 to-blue-600' },
  { key: 'downloading', label: 'Mengunduh', icon: '📥', color: 'from-cyan-400 to-cyan-600' },
  { key: 'transcribing', label: 'Transkripsi', icon: '🎙️', color: 'from-purple-400 to-purple-600' },
  { key: 'diarization', label: 'Identifikasi Pembicara', icon: '👥', color: 'from-pink-400 to-pink-600' },
  { key: 'ai_analysis', label: 'Analisis AI', icon: '🤖', color: 'from-violet-400 to-violet-600' },
  { key: 'saving', label: 'Menyimpan', icon: '💾', color: 'from-indigo-400 to-indigo-600' },
  { key: 'completed', label: 'Selesai', icon: '✅', color: 'from-green-400 to-green-600' },
] as const

function getStageIndex(stage?: string): number {
  if (!stage) return -1
  return PROCESSING_STAGES.findIndex(s => s.key === stage)
}

function getStageBadge(stage?: string): { label: string; icon: string } | null {
  if (!stage) return null
  const found = PROCESSING_STAGES.find(s => s.key === stage)
  return found || null
}

export default function StatusMeetingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const meetingIdFromUrl = searchParams.get('id')
  
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const { api, isReady } = useApiWithAuth()

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

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      // Search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase()
        const matchesTitle = meeting.title?.toLowerCase().includes(search)
        const matchesPlatform = meeting.platform?.toLowerCase().includes(search)
        const matchesSummary = meeting.summary?.toLowerCase().includes(search)
        if (!matchesTitle && !matchesPlatform && !matchesSummary) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          if (!["processing", "uploading", "recording"].includes(meeting.status)) {
            return false
          }
        } else if (meeting.status !== statusFilter) {
          return false
        }
      }

      // Platform filter
      if (platformFilter !== "all") {
        if (meeting.platform?.toLowerCase() !== platformFilter.toLowerCase()) {
          return false
        }
      }

      return true
    })
  }, [meetings, debouncedSearch, statusFilter, platformFilter])

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

  const fetchMeetings = useCallback(async () => {
    if (!isReady) return
    
    try {
      const response = await api.getMeetings({ limit: 20 })
      setMeetings(response.meetings || [])
    } catch (error) {
      console.error("Error fetching meetings:", error)
      toast.error("Gagal memuat status meeting")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isReady, api])

  // Initial fetch
  useEffect(() => {
    if (isReady) {
      fetchMeetings()
    } else {
      setIsLoading(false)
    }
  }, [isReady, fetchMeetings])

  // Socket integration for real-time updates
  useEffect(() => {
    const socket = getSocket()

    // Listen for transcription progress updates
    socket.on('transcription_progress', ({ meetingId, progress, message, stage }) => {
      setMeetings(prev => prev.map(m => {
        if (m._id === meetingId) {
          const newLog: ProcessingLog = { message, timestamp: new Date().toISOString(), progress, stage }
          return {
            ...m,
            processingProgress: progress,
            processingStage: stage || m.processingStage,
            processingLogs: [...(m.processingLogs || []), newLog].slice(-15) // Keep last 15 logs
          }
        }
        return m
      }))
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

    return () => {
      socket.off('transcription_progress')
      socket.off('transcription_complete')
      socket.off('transcription_failed')
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
      m.status === 'queued'
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
                    return {
                      ...pm,
                      status: res.data.status,
                      processingProgress: res.data.job?.progress || pm.processingProgress || 0,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"><IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
      case "recording":
      case "processing":
      case "uploading":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 animate-pulse"><IconLoader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" /></div>
      case "pending":
      case "queued":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30"><IconClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
      case "cancelled":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"><IconX className="h-5 w-5 text-gray-600 dark:text-gray-400" /></div>
      case "failed":
      case "error":
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"><IconAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
      default:
        return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><IconClock className="h-5 w-5 text-muted-foreground" /></div>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">Selesai</Badge>
      case "recording":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0 animate-pulse">Merekam</Badge>
      case "processing":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-0 animate-pulse">Memproses</Badge>
      case "uploading":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0">Mengunggah</Badge>
      case "pending":
      case "queued":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-0 flex items-center gap-1.5"><IconLoader2 className="h-3 w-3 animate-spin" />Memproses...</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-0">Dibatalkan</Badge>
      case "failed":
      case "error":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-0">Gagal</Badge>
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
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Status Meeting
                    </h1>
                    <p className="text-muted-foreground">Monitor dan lacak progres meeting secara real-time</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="border-border hover:bg-accent hover:text-accent-foreground transition-all"
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
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="google meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="teams">Teams</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
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

                  <div className="ml-auto text-sm text-muted-foreground">
                    Showing {filteredMeetings.length} of {meetings.length} meetings
                  </div>
                </div>
              </div>

              {/* Status Overview */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Selesai</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 animate-pulse">
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <IconX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{statusCounts.cancelled}</div>
                      <p className="text-xs text-muted-foreground mt-1">Meeting dibatalkan</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Gagal</CardTitle>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
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

                              {/* Summary */}
                              {meeting.summarySnippet && meeting.status === 'completed' && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                  {meeting.summarySnippet}
                                </p>
                              )}

                              {/* Processing Progress */}
                              {(meeting.status === 'processing' || meeting.status === 'uploading' || meeting.status === 'pending' || meeting.status === 'queued') && (meeting.processingLogs && meeting.processingLogs.length > 0 || meeting.processingProgress) && (
                                <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-primary/10">
                                  {/* Stage Pills */}
                                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                    {PROCESSING_STAGES.slice(0, -1).map((stage, idx) => {
                                      const currentIdx = getStageIndex(meeting.processingStage)
                                      const isCompleted = idx < currentIdx
                                      const isCurrent = idx === currentIdx
                                      return (
                                        <div 
                                          key={stage.key}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-500 ${
                                            isCurrent 
                                              ? `bg-gradient-to-r ${stage.color} text-white shadow-md animate-pulse scale-105` 
                                              : isCompleted 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                                : 'bg-muted text-muted-foreground opacity-50'
                                          }`}
                                        >
                                          <span className="text-sm">{stage.icon}</span>
                                          <span className="hidden sm:inline">{stage.label}</span>
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {/* Current Status */}
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        {meeting.processingStage && getStageBadge(meeting.processingStage) && (
                                          <span className="text-lg shrink-0 mt-0.5 animate-bounce">
                                            {getStageBadge(meeting.processingStage)?.icon}
                                          </span>
                                        )}
                                        <p className="text-sm font-medium text-primary leading-relaxed">
                                          {meeting.processingLogs && meeting.processingLogs.length > 0 
                                            ? meeting.processingLogs[meeting.processingLogs.length - 1].message 
                                            : 'Sedang memproses...'}
                                        </p>
                                      </div>
                                      <span className="text-lg font-bold text-primary shrink-0">
                                        {meeting.processingProgress || 0}%
                                      </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                                        style={{ 
                                          width: `${meeting.processingProgress || 0}%`,
                                          boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                                        }}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expandable Logs */}
                                  {meeting.processingLogs && meeting.processingLogs.length > 1 && (
                                    <div className="border-t border-border/50 pt-3">
                                      <button 
                                        onClick={() => toggleLogExpand(meeting._id)}
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                      >
                                        {expandedLogs.has(meeting._id) ? (
                                          <>
                                            <IconChevronUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
                                            <span>Sembunyikan Log</span>
                                          </>
                                        ) : (
                                          <>
                                            <IconChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
                                            <span>Lihat Detail Log ({meeting.processingLogs.length})</span>
                                          </>
                                        )}
                                      </button>
                                      {expandedLogs.has(meeting._id) && (
                                        <div className="mt-3 p-3 bg-card rounded-lg border border-border shadow-sm max-h-48 overflow-y-auto space-y-1">
                                          {meeting.processingLogs.map((log, i) => (
                                            <div 
                                              key={i} 
                                              className="flex items-center gap-2 py-2 px-2 rounded hover:bg-muted/50 transition-colors text-xs"
                                            >
                                              <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                                                {new Date(log.timestamp).toLocaleTimeString([], {
                                                  hour: '2-digit', 
                                                  minute:'2-digit', 
                                                  second:'2-digit'
                                                })}
                                              </span>
                                              {log.stage && getStageBadge(log.stage) && (
                                                <span className="shrink-0">{getStageBadge(log.stage)?.icon}</span>
                                              )}
                                              <span className="flex-1 text-foreground">{log.message}</span>
                                              {log.progress !== undefined && (
                                                <span className="shrink-0 text-primary font-bold text-sm">
                                                  {log.progress}%
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
