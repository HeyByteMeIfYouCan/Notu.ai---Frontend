"use client"

import { useState, useEffect, useCallback } from "react"
import { getSocket } from "@/lib/socket"
import { IconRefresh, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface RealtimeNotification {
  id: string
  type: string
  userName: string
  message: string
  timestamp: Date
}

interface RealtimeBannerProps {
  meetingId: string
  currentUserName?: string
  onRefresh: () => void
}

const UPDATE_TYPE_MESSAGES: Record<string, string> = {
  'title_updated': 'mengubah judul meeting',
  'description_updated': 'mengubah deskripsi meeting',
  'summary_updated': 'mengubah ringkasan meeting',
  'highlights_updated': 'mengubah highlights meeting',
  'conclusion_updated': 'mengubah kesimpulan meeting',
  'tags_updated': 'mengubah tags meeting',
  'segment_edited': 'mengubah nama pembicara',
}

export function RealtimeBanner({ meetingId, currentUserName, onRefresh }: RealtimeBannerProps) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [showBanner, setShowBanner] = useState(false)

  const addNotification = useCallback((type: string, userName: string) => {
    // Don't show notification for current user's own actions
    if (userName === currentUserName) return

    const message = UPDATE_TYPE_MESSAGES[type] || 'melakukan perubahan'
    const notification: RealtimeNotification = {
      id: `${type}-${Date.now()}`,
      type,
      userName,
      message,
      timestamp: new Date(),
    }

    setNotifications(prev => [...prev.slice(-4), notification]) // Keep last 5
    setShowBanner(true)
  }, [currentUserName])

  useEffect(() => {
    if (!meetingId) return

    const socket = getSocket()

    const handleContentUpdated = (data: { meetingId: string; updateType: string; userName: string }) => {
      if (data.meetingId === meetingId) {
        addNotification(data.updateType, data.userName)
      }
    }

    const handleAiRegenerated = (data: { meetingId: string; userName: string }) => {
      if (data.meetingId === meetingId) {
        addNotification('ai_regenerated', data.userName)
      }
    }

    const handleActionSynced = (data: { meetingId: string; userName: string }) => {
      if (data.meetingId === meetingId) {
        addNotification('action_synced', data.userName)
      }
    }

    socket.on('meeting_content_updated', handleContentUpdated)
    socket.on('meeting_ai_regenerated', handleAiRegenerated)
    socket.on('meeting_action_synced', handleActionSynced)

    return () => {
      socket.off('meeting_content_updated', handleContentUpdated)
      socket.off('meeting_ai_regenerated', handleAiRegenerated)
      socket.off('meeting_action_synced', handleActionSynced)
    }
  }, [meetingId, addNotification])

  const handleRefresh = () => {
    onRefresh()
    setNotifications([])
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setNotifications([])
    setShowBanner(false)
  }

  if (!showBanner || notifications.length === 0) return null

  const latestNotification = notifications[notifications.length - 1]

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 rounded-lg border border-[color-mix(in_oklch,var(--chart-3)_25%,var(--border))] bg-[color-mix(in_oklch,var(--chart-3)_10%,var(--card))] px-4 py-3 text-[var(--foreground)]">
        <div className="flex-1">
          <p className="text-sm text-[var(--foreground)]">
            <span className="font-semibold">{latestNotification.userName}</span>{" "}
            {latestNotification.message}
            {notifications.length > 1 && (
              <span className="ml-1 text-[var(--muted-foreground)]">
                (+{notifications.length - 1} perubahan lainnya)
              </span>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-[var(--primary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={handleRefresh}
        >
          <IconRefresh className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={handleDismiss}
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
