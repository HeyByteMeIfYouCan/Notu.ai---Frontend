"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconDots, IconVideo, IconLoader2, IconUpload, IconBrandGoogle, IconExternalLink, IconShare, IconPin, IconPinFilled, IconInfoCircle, IconTrash, IconCopy, IconMicrophone, IconMessageCircle } from '@tabler/icons-react'
import { toast } from 'sonner'
import { getPermissions, getRoleLabel } from '@/lib/permissions'
import { useApiWithAuth } from '@/hooks/use-auth'
import { emitPinChange, pinEvents } from '@/lib/pinEvents'

interface Props {
  id: string | number
  tag: string
  type?: string
  platform?: string
  date: string
  title: string
  description: string
  status?: string
  userRole?: string
  shareToken?: string
  createdAt?: string
  isPinned?: boolean
  onPinChange?: (id: string, pinned: boolean) => void
  onDelete?: (id: string) => void
  onViewLiveTranscript?: (id: string) => void
}

const MeetingCard = ({ data }: { data: Props }) => {
  const router = useRouter()
  const { api, isReady } = useApiWithAuth()
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinned, setIsPinned] = useState(data.isPinned || false)
  const [isTogglingPin, setIsTogglingPin] = useState(false)

  // Get permissions based on user role
  const permissions = useMemo(() => getPermissions(data.userRole), [data.userRole])

  // Sync isPinned with props when data changes (e.g., when navigating between pages)
  useEffect(() => {
    setIsPinned(data.isPinned || false);
  }, [data.isPinned]);

  // Subscribe to pin events for sync when unpinned from sidebar
  useEffect(() => {
    const unsubscribe = pinEvents.subscribe((event) => {
      if (event.type === 'meeting' && event.id === String(data.id)) {
        setIsPinned(event.pinned);
      }
    });
    return () => unsubscribe();
  }, [data.id]);

  const handleClick = () => {
    router.push(`/dashboard/meeting/${data.id}`)
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/meeting/${data.id}`)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = data.shareToken
      ? `${window.location.origin}/dashboard/join/meeting/${data.shareToken}`
      : `${window.location.origin}/dashboard/meeting/${data.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Link kolaborasi meeting disalin")
  }

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isReady) {
      toast.error("Silakan login terlebih dahulu")
      return
    }
    setIsTogglingPin(true)
    try {
      const response = await api.toggleMeetingPin(String(data.id))
      const newPinState = response.pinned ?? response.data?.pinned ?? !isPinned
      setIsPinned(newPinState)
      data.onPinChange?.(String(data.id), newPinState)
      // Emit event for sidebar sync
      emitPinChange('meeting', String(data.id), newPinState)
      toast.success(newPinState ? "Berhasil pin meeting" : "Berhasil unpin meeting")
    } catch (error: any) {
      const errorMsg = error.message || "Gagal toggle pin"
      if (errorMsg.includes("Not authenticated") || errorMsg.includes("Token expired")) {
        toast.error("Sesi telah berakhir. Silakan login ulang.")
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setIsTogglingPin(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Apakah Anda yakin ingin menghapus meeting ini?")) return
    
    setIsDeleting(true)
    try {
      await api.deleteMeeting(String(data.id))
      data.onDelete?.(String(data.id))
      toast.success("Meeting berhasil dihapus")
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus meeting")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = () => {
    if (!data.status) return null

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      recording: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Recording' },
      processing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Processing' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    }

    const config = statusConfig[data.status] || statusConfig.pending
    return (
      <Badge className={`${config.bg} ${config.text} hover:${config.bg}`}>
        {data.status === 'processing' || data.status === 'recording' ? (
          <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : null}
        {config.label}
      </Badge>
    )
  }

  return (
    <>
      <Card
        key={data.id}
        className="bg-[var(--card)] shadow-border/50 cursor-pointer hover:shadow-md transition-shadow relative group"
        onClick={handleClick}
      >
        <CardContent>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                {data.tag}
              </Badge>
              {getStatusBadge()}
              {isPinned && (
                <IconPinFilled className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* <IconVideo className="h-4 w-4 text-muted-foreground" /> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-muted transition-colors"
                  >
                    <IconDots className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleOpen} className="cursor-pointer">
                    <IconExternalLink className="h-4 w-4 mr-2" />
                    Buka
                  </DropdownMenuItem>
                  
                  {/* View Live Transcript - for active bot meetings */}
                  {(data.status === 'recording' || data.status === 'in_meeting') && data.type === 'online' && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); data.onViewLiveTranscript?.(String(data.id)) }} className="cursor-pointer">
                      <IconMessageCircle className="h-4 w-4 mr-2" />
                      Lihat Live Transcript
                    </DropdownMenuItem>
                  )}
                  
                  {/* Share - Owner/Admin only */}
                  {(data.userRole === 'owner' || data.userRole === 'admin') && (
                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                      <IconShare className="h-4 w-4 mr-2" />
                      Bagikan Link Meeting
                    </DropdownMenuItem>
                  )}
                  
                  {/* Pin - Everyone can pin (per-user) */}
                  {permissions.canPin && (
                    <DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer" disabled={isTogglingPin}>
                      {isPinned ? (
                        <>
                          <IconPinFilled className="h-4 w-4 mr-2" />
                          Hapus Pin
                        </>
                      ) : (
                        <>
                          <IconPin className="h-4 w-4 mr-2" />
                          Pin Meeting
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Info - Everyone can view */}
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowInfoDialog(true) }} className="cursor-pointer">
                    <IconInfoCircle className="h-4 w-4 mr-2" />
                    Info
                  </DropdownMenuItem>
                  
                  {/* Delete - Owner or Admin only */}
                  {(data.userRole === 'owner' || data.userRole === 'admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="cursor-pointer text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <IconTrash className="h-4 w-4 mr-2" />
                        )}
                        Hapus
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            {(() => {
              const isUpload = data.type === 'upload' || data.platform === 'Upload'
              if (isUpload) return <IconUpload className="h-4 w-4" />
              if (data.platform === 'Google Meet') return <IconBrandGoogle className="h-4 w-4" />
              if (data.platform === 'Microphone') return <IconMicrophone className="h-4 w-4" />
              return <IconVideo className="h-4 w-4" />
            })()}
            <span>{data.platform || 'Google Meet'} • {data.date}</span>
          </div>

          <h3 className="mb-2 font-semibold text-foreground">{data.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{data.description}</p>
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Informasi Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Judul</div>
                <div className="text-sm font-semibold text-foreground">{data.title}</div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Deskripsi</div>
                <div className="text-sm text-foreground">{data.description || 'Tidak ada deskripsi'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Tanggal</div>
                  <div className="text-sm font-semibold text-foreground">{data.date}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Platform</div>
                  <div className="text-sm font-semibold text-foreground">{data.platform || 'Unknown'}</div>
                </div>
              </div>

              {data.userRole && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Role Anda</div>
                  <div className="text-sm font-semibold text-primary">{getRoleLabel(data.userRole)}</div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Meeting ID</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground/70 truncate flex-1">{data.id}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    navigator.clipboard.writeText(String(data.id))
                    toast.success("Meeting ID disalin")
                  }}>
                    <IconCopy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MeetingCard