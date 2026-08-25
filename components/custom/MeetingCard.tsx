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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      toast.error("Login dulu untuk lanjut, ya")
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
        toast.error("Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.")
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setIsTogglingPin(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await api.deleteMeeting(String(data.id))
      data.onDelete?.(String(data.id))
      toast.success("Meeting berhasil dihapus")
      setShowDeleteConfirm(false)
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus meeting")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = () => {
    if (!data.status) return null

    const statusConfig: Record<string, { className: string; label: string }> = {
      pending: { className: 'border-transparent bg-muted text-muted-foreground', label: 'Menunggu' },
      recording: { className: 'border-transparent bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', label: 'Sedang merekam' },
      processing: { className: 'border-transparent bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', label: 'Sedang diproses' },
      completed: { className: 'border-transparent bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', label: 'Siap dibuka' },
      failed: { className: 'border-transparent bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400', label: 'Gagal diproses' },
    }

    const config = statusConfig[data.status] || statusConfig.pending
    return (
      <Badge variant="outline" className={config.className}>
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
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        onClick={handleClick}
      >
        <CardContent className="relative z-10 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-transparent bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
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
                        onClick={handleDeleteClick}
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
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/50 text-foreground transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:transform-none">
              {(() => {
                const isUpload = data.type === 'upload' || data.platform === 'Upload'
                if (isUpload) return <IconUpload className="h-3.5 w-3.5" />
                if (data.platform === 'Google Meet') return <IconBrandGoogle className="h-3.5 w-3.5" />
                if (data.platform === 'Microphone') return <IconMicrophone className="h-3.5 w-3.5" />
                return <IconVideo className="h-3.5 w-3.5" />
              })()}
            </span>
            <span>{data.platform || 'Google Meet'} • {data.date}</span>
          </div>

          <h3 className="mb-2 text-[1.05rem] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{data.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 text-balance">{data.description}</p>
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-border/60 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-b from-muted/50 to-background px-6 py-5 border-b border-border/40">
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <IconInfoCircle className="h-5 w-5 text-primary" />
              Detail Meeting
            </DialogTitle>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] items-start gap-3">
                <span className="text-muted-foreground font-medium mt-0.5">Judul</span>
                <span className="text-foreground font-medium leading-snug">{data.title}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-3">
                <span className="text-muted-foreground font-medium mt-0.5">Deskripsi</span>
                <span className="text-foreground/80 leading-relaxed">{data.description || '—'}</span>
              </div>
              
              <div className="my-1 h-px bg-border/40" />
              
              <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                <span className="text-muted-foreground font-medium">Tanggal</span>
                <span className="text-foreground">{data.date}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                <span className="text-muted-foreground font-medium">Platform</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  {data.platform === 'Google Meet' && <IconBrandGoogle className="h-4 w-4 text-muted-foreground" />}
                  {data.platform}
                </span>
              </div>
              {data.userRole && (
                <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <span className="text-muted-foreground font-medium">Akses</span>
                  <div className="flex items-center">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent hover:bg-primary/15 font-medium px-2 py-0.5 text-xs">
                      {getRoleLabel(data.userRole)}
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="my-1 h-px bg-border/40" />
              
              <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                <span className="text-muted-foreground font-medium">Meeting ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded-md border border-border/50">{data.id}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => {
                    navigator.clipboard.writeText(String(data.id))
                    toast.success("Meeting ID disalin")
                  }}>
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md border-border/60" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus Meeting</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus meeting <strong className="text-foreground">{data.title}</strong>? Data presentasi, transkrip, dan insight yang telah dihapus tidak dapat dipulihkan kembali.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="cursor-pointer">
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting} className="cursor-pointer">
              {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
              Hapus Permanen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MeetingCard
