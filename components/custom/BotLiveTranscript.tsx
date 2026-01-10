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
  bot_joining: { label: "Bot Bergabung", color: "bg-blue-500", icon: <IconRobot className="h-4 w-4 animate-pulse" /> },
  bot_in_meeting: { label: "Bot di Meeting", color: "bg-green-500", icon: <IconRobot className="h-4 w-4" /> },
  recording: { label: "Merekam", color: "bg-red-500", icon: <IconMicrophone className="h-4 w-4 animate-pulse" /> },
  processing: { label: "Memproses", color: "bg-purple-500", icon: <IconBrain className="h-4 w-4 animate-pulse" /> },
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
  const scrollRef = useRef<HTMLDivElement>(null)

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

  // Join live room on mount
  useEffect(() => {
    if (meetingId && isReady) {
      joinLiveRoom()
    }
    return () => {
      leaveLiveRoom()
    }
  }, [meetingId, isReady, joinLiveRoom, leaveLiveRoom])

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [segments])

  const handleStop = async () => {
    if (!isReady) return
    
    setIsStopping(true)
    try {
      await api.stopBotSession(meetingId, 'user_requested')
      toast.info("Bot dihentikan")
    } catch (err: any) {
      toast.error(err.message || "Gagal menghentikan bot")
    } finally {
      setIsStopping(false)
    }
  }

  const handleFinalize = async () => {
    if (!isReady) return
    
    setIsFinalizing(true)
    try {
      await api.finalizeBotMeeting(meetingId, {
        enableDiarization: true,
        enableAiNotes: true,
      })
      toast.success("Transkripsi sedang difinalisasi...")
    } catch (err: any) {
      toast.error(err.message || "Gagal finalisasi")
    } finally {
      setIsFinalizing(false)
    }
  }

  const statusInfo = statusLabels[status] || statusLabels.pending
  const isActive = ['bot_joining', 'bot_in_meeting', 'recording'].includes(status)
  const canStop = isActive && !isStopping
  const canFinalize = status === 'completed' && !isFinalizing
  const accumulatedText = getAccumulatedText()

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
            {segments.length === 0 && !previewText ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                {isActive ? (
                  <>
                    <IconMicrophone className="h-8 w-8 mb-2 animate-pulse" />
                    <p className="text-sm">Menunggu audio...</p>
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
            
            {canFinalize && (
              <Button 
                size="sm"
                onClick={handleFinalize}
                disabled={isFinalizing}
              >
                {isFinalizing ? (
                  <IconLoader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <IconBrain className="h-4 w-4 mr-1" />
                )}
                Finalize dengan AI
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
