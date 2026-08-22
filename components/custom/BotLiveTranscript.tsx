"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  IconRobot,
  IconPlayerStop,
  IconDownload,
  IconLoader2,
  IconMicrophone,
  IconMicrophoneOff,
  IconCheck,
  IconX,
  IconClock,
  IconBrain,
} from "@tabler/icons-react"
import { useBotLiveTranscription } from "@/hooks/use-bot-live-transcription"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BotLiveTranscriptProps {
  meetingId: string
  onComplete?: () => void
  onError?: (error: string) => void
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Menunggu", color: "bg-yellow-500", icon: <IconClock className="h-4 w-4" /> },
  joining: { label: "Bot Memulai", color: "bg-blue-400", icon: <IconRobot className="h-4 w-4 animate-pulse" /> },
  bot_joining: { label: "Bot Bergabung", color: "bg-blue-500", icon: <IconRobot className="h-4 w-4 animate-pulse" /> },
  waiting_admission: { label: "Menunggu Host", color: "bg-orange-500", icon: <IconClock className="h-4 w-4 animate-pulse" /> },
  disabling_media: { label: "Mematikan Mic/Cam", color: "bg-blue-400", icon: <IconMicrophoneOff className="h-4 w-4" /> },
  bot_in_meeting: { label: "Bot di Meeting", color: "bg-green-500", icon: <IconRobot className="h-4 w-4" /> },
  in_meeting: { label: "Bot di Meeting", color: "bg-green-500", icon: <IconRobot className="h-4 w-4" /> },
  enabling_captions: { label: "Mengaktifkan CC", color: "bg-purple-400", icon: <IconBrain className="h-4 w-4 animate-pulse" /> },
  recording: { label: "Merekam", color: "bg-red-500", icon: <IconMicrophone className="h-4 w-4 animate-pulse" /> },
  processing: { label: "Memproses", color: "bg-purple-500", icon: <IconBrain className="h-4 w-4 animate-pulse" /> },
  leaving: { label: "Keluar Meeting", color: "bg-gray-500", icon: <IconRobot className="h-4 w-4" /> },
  completed: { label: "Selesai", color: "bg-green-600", icon: <IconCheck className="h-4 w-4" /> },
  failed: { label: "Gagal", color: "bg-red-600", icon: <IconX className="h-4 w-4" /> },
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function BotLiveTranscript({ meetingId, onComplete, onError }: BotLiveTranscriptProps) {
  const { api, isReady } = useApiWithAuth()
  const [isStopping, setIsStopping] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [meetingStatus, setMeetingStatus] = useState<string | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [completedTranscript, setCompletedTranscript] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stopToastShownRef = useRef(false) // Prevent duplicate toasts

  // Fetch meeting status first to determine if it's live or completed
  useEffect(() => {
    const fetchMeetingStatus = async () => {
      if (!meetingId || !isReady) return
      
      setIsLoadingStatus(true)
      try {
        const meeting = await api.getMeeting(meetingId)
        setMeetingStatus(meeting.status)
        
        // If completed, load the transcript data
        if (meeting.status === 'completed') {
          setCompletedTranscript(meeting)
        }
      } catch (err: any) {
        console.error('Failed to fetch meeting status:', err)
        onError?.(err.message || 'Gagal memuat status meeting')
      } finally {
        setIsLoadingStatus(false)
      }
    }

    fetchMeetingStatus()
  }, [meetingId, isReady])

  const {
    isConnected,
    status,
    previewText,
    segments,
    chunksProcessed,
    duration,
    error,
    joinLiveRoom,
    leaveLiveRoom,
    getAccumulatedText,
  } = useBotLiveTranscription({
    meetingId,
    onComplete: (data) => {
      toast.success("Transkripsi selesai!")
      onComplete?.()
    },
    onError: (err) => {
      toast.error(err)
      onError?.(err)
    },
  })

  // The hook already joins the meeting room via socket.emit('join_meeting')
  // joinLiveRoom is redundant and causes flapping - skip it
  // Just track when we should show live vs completed
  const liveRoomJoinedRef = useRef(false)
  
  useEffect(() => {
    if (meetingId && !liveRoomJoinedRef.current) {
      liveRoomJoinedRef.current = true
      joinLiveRoom()
    }
    return () => {
      if (liveRoomJoinedRef.current) {
        leaveLiveRoom()
        liveRoomJoinedRef.current = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]) // Only depend on meetingId to prevent flapping

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (scrollRef.current) {
      // ScrollArea uses internal viewport, find it and scroll
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        // Fallback for regular div
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [segments, completedTranscript])

  const handleStop = async () => {
    if (!isReady) return
    
    setIsStopping(true)
    try {
      await api.stopBotSession(meetingId, 'user_requested')
      
      // Only show toast once
      if (!stopToastShownRef.current) {
        toast.info("Bot dihentikan")
        stopToastShownRef.current = true
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menghentikan bot")
    } finally {
      setIsStopping(false)
    }
  }

  // If loading status, show spinner
  if (isLoadingStatus) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // If meeting is completed, show completed transcript view
  if (meetingStatus === 'completed' && completedTranscript) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconRobot className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Transcript Selesai</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1 bg-green-600 text-white">
              <IconCheck className="h-4 w-4" />
              Completed
            </Badge>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-4">
          <ScrollArea 
            className="h-[300px] w-full rounded-md border p-4 bg-muted/30"
            ref={scrollRef}
          >
            {completedTranscript.segments && completedTranscript.segments.length > 0 ? (
              <div className="space-y-2">
                {completedTranscript.segments.map((segment: any, index: number) => (
                  <div 
                    key={index}
                    className="p-2 rounded bg-background/50"
                  >
                    <p className="text-sm font-medium text-primary mb-1">{segment.speaker || 'Speaker'}</p>
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <IconMicrophoneOff className="h-8 w-8 mb-2" />
                <p className="text-sm">Tidak ada transkripsi</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }


  const statusInfo = statusLabels[status] || statusLabels.pending
  const isActive = ['joining', 'bot_joining', 'waiting_admission', 'disabling_media', 'bot_in_meeting', 'in_meeting', 'enabling_captions', 'recording'].includes(status)
  const canStop = isActive && !isStopping

  const accumulatedText = getAccumulatedText()

  // Show transcript if we have data OR if status indicates we should be recording
  // Also show immediately if we have segments/preview (captions might arrive before status update)
  const hasData = segments.length > 0 || previewText.length > 0
  const showTranscript = hasData || ['enabling_captions', 'bot_in_meeting', 'in_meeting', 'recording', 'processing', 'completed'].includes(status)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconRobot className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">Live Transcription</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <Badge variant="secondary" className={cn("gap-1", statusInfo.color, "text-white")}>
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
            
            {/* Duration */}
            {duration > 0 && (
              <Badge variant="outline" className="gap-1">
                <IconClock className="h-3 w-3" />
                {formatDuration(duration)}
              </Badge>
            )}
            
            {/* Chunks processed */}
            {chunksProcessed > 0 && (
              <Badge variant="outline">
                {chunksProcessed} chunks
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-4">
        {/* Connection status indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-gray-400"
          )} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Terhubung ke live feed" : "Tidak terhubung"}
          </span>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Live transcript display */}
        <div className="relative">
          <ScrollArea 
            className="h-[300px] w-full rounded-md border p-4 bg-muted/30"
            ref={scrollRef}
          >
            {!showTranscript ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                {status === 'waiting_admission' ? (
                  <>
                    <IconClock className="h-8 w-8 mb-2 animate-pulse text-orange-500" />
                    <p className="text-sm font-medium">Menunggu Host</p>
                    <p className="text-xs mt-1">Bot menunggu persetujuan untuk masuk...</p>
                  </>
                ) : status === 'joining' || status === 'bot_joining' ? (
                  <>
                    <IconRobot className="h-8 w-8 mb-2 animate-pulse text-blue-500" />
                    <p className="text-sm font-medium">Bot Sedang Bergabung</p>
                    <p className="text-xs mt-1">Mematikan mic/camera...</p>
                  </>
                ) : status === 'disabling_media' ? (
                  <>
                    <IconMicrophoneOff className="h-8 w-8 mb-2 text-blue-400" />
                    <p className="text-sm font-medium">Mematikan Mic & Camera</p>
                  </>
                ) : status === 'enabling_captions' ? (
                  <>
                    <IconBrain className="h-8 w-8 mb-2 animate-pulse text-purple-500" />
                    <p className="text-sm font-medium">Mengaktifkan Caption</p>
                    <p className="text-xs mt-1">Menyiapkan transkripsi...</p>
                  </>
                ) : (
                  <>
                    <IconLoader2 className="h-8 w-8 mb-2 animate-spin" />
                    <p className="text-sm">Memulai bot...</p>
                  </>
                )}
              </div>
            ) : segments.length === 0 && !previewText ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                {isActive ? (
                  <>
                    <IconMicrophone className="h-8 w-8 mb-2 animate-pulse" />
                    <p className="text-sm">Menunggu caption dari Google Meet...</p>
                  </>
                ) : (
                  <>
                    <IconMicrophoneOff className="h-8 w-8 mb-2" />
                    <p className="text-sm">Belum ada transkripsi</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div 
                    key={`${segment.chunkIndex}-${index}`}
                    className="p-2 rounded bg-background/50"
                  >
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                    <span className="text-xs text-muted-foreground">
                      Chunk {segment.chunkIndex + 1}
                    </span>
                  </div>
                ))}
                
                {/* Current live preview (latest) */}
                {previewText && isActive && (
                  <div className="p-2 rounded bg-primary/10 border border-primary/20 animate-pulse">
                    <p className="text-sm leading-relaxed">{previewText}</p>
                    <span className="text-xs text-primary">Live</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          {/* Recording indicator */}
          {status === 'recording' && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                REC
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">
            {accumulatedText.length > 0 && (
              <span>{accumulatedText.split(' ').length} kata</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canStop && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleStop}
                disabled={isStopping}
              >
                {isStopping ? (
                  <IconLoader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <IconPlayerStop className="h-4 w-4 mr-1" />
                )}
                Stop Bot
              </Button>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  )
}
