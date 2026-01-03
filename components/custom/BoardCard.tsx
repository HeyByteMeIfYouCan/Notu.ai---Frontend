"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { IconLayoutBoard, IconDots, IconExternalLink, IconShare, IconPin, IconPinFilled, IconInfoCircle, IconTrash, IconVideo, IconLoader2, IconCopy } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getPermissions, getRoleLabel } from "@/lib/permissions"
import { useApiWithAuth } from "@/hooks/use-auth"
import { emitPinChange, pinEvents } from "@/lib/pinEvents"

interface BoardCardProps {
  board: {
    _id: string
    title: string
    description?: string
    updatedAt: string
    labels?: { name: string }[] | string[]
    userRole?: 'owner' | 'admin' | 'editor' | 'viewer'
    userId?: { name?: string; _id?: string }
    meetingId?: { _id: string; title?: string } | string
    pinned?: boolean
    shareToken?: string
  }
  onPinChange?: (id: string, pinned: boolean) => void
  onDelete?: (id: string) => void
}

export default function BoardCard({ board, onPinChange, onDelete }: BoardCardProps) {
  const router = useRouter()
  const { api, isReady } = useApiWithAuth()
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinned, setIsPinned] = useState(board.pinned || false)
  const [isTogglingPin, setIsTogglingPin] = useState(false)

  // Get permissions based on user role
  const permissions = useMemo(() => getPermissions(board.userRole), [board.userRole])

  // Sync isPinned with props when data changes (e.g., when navigating between pages)
  useEffect(() => {
    setIsPinned(board.pinned || false);
  }, [board.pinned]);

  // Subscribe to pin events for sync when unpinned from sidebar
  useEffect(() => {
    const unsubscribe = pinEvents.subscribe((event) => {
      if (event.type === 'board' && event.id === board._id) {
        setIsPinned(event.pinned);
      }
    });
    return () => unsubscribe();
  }, [board._id]);

  const roleLabel = board.userRole === 'owner' ? 'My Board' : 'Shared'
  const roleBadgeColor = board.userRole === 'owner' 
    ? 'bg-primary/10 text-primary' 
    : 'bg-blue-100 text-blue-700'

  const handleClick = () => {
    router.push(`/dashboard/kanban/${board._id}`)
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/kanban/${board._id}`)
  }

  const handleGoToMeeting = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (board.meetingId) {
      const meetingIdStr = typeof board.meetingId === 'object' ? board.meetingId._id : board.meetingId
      router.push(`/dashboard/meeting/${meetingIdStr}`)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = board.shareToken
      ? `${window.location.origin}/dashboard/join/board/${board.shareToken}`
      : `${window.location.origin}/dashboard/kanban/${board._id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Link kolaborasi kanban disalin")
  }

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isReady) {
      toast.error("Silakan login terlebih dahulu")
      return
    }
    setIsTogglingPin(true)
    try {
      const response = await api.toggleBoardPin(board._id)
      const newPinState = response.pinned ?? response.data?.pinned ?? !isPinned
      setIsPinned(newPinState)
      onPinChange?.(board._id, newPinState)
      // Emit event for sidebar sync
      emitPinChange('board', board._id, newPinState)
      toast.success(newPinState ? "Berhasil pin kanban" : "Berhasil unpin kanban")
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
    if (!confirm("Apakah Anda yakin ingin menghapus board ini?")) return
    
    setIsDeleting(true)
    try {
      await api.deleteBoard(board._id)
      onDelete?.(board._id)
      toast.success("Board berhasil dihapus")
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus board")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card
        onClick={handleClick}
        className="cursor-pointer hover:shadow-lg transition-shadow relative group"
        style={{ borderRadius: 'var(--kanban-card-radius)', boxShadow: 'var(--kanban-card-shadow)', background: 'var(--kanban-card-bg)' }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-3 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.03)' }}>
                <IconLayoutBoard className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-foreground line-clamp-1">{board.title}</CardTitle>
                  {isPinned && (
                    <IconPinFilled className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2">{board.description || 'No description'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{new Date(board.updatedAt).toLocaleDateString()}</span>
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
                  
                  {/* Go to Meeting - if board has meetingId */}
                  {board.meetingId && (
                    <DropdownMenuItem onClick={handleGoToMeeting} className="cursor-pointer">
                      <IconVideo className="h-4 w-4 mr-2" />
                      Ke Meeting
                    </DropdownMenuItem>
                  )}
                  
                  {/* Share - Owner/Admin only */}
                  {(board.userRole === 'owner' || board.userRole === 'admin') && (
                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                      <IconShare className="h-4 w-4 mr-2" />
                      Bagikan Link Kanban
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
                          Pin Board
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
                  {(board.userRole === 'owner' || board.userRole === 'admin') && (
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
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {board.labels && board.labels.slice(0,3).map((l: any) => (
                <span key={l.name || l} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{l.name || l}</span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>{roleLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Informasi Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Judul</div>
                <div className="text-sm font-semibold text-foreground">{board.title}</div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Deskripsi</div>
                <div className="text-sm text-foreground">{board.description || 'Tidak ada deskripsi'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Diperbarui</div>
                  <div className="text-sm font-semibold text-foreground">{new Date(board.updatedAt).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Label</div>
                  <div className="text-sm font-semibold text-foreground">{board.labels?.length || 0}</div>
                </div>
              </div>

              {board.userRole && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Role Anda</div>
                  <div className="text-sm font-semibold text-primary">{getRoleLabel(board.userRole)}</div>
                </div>
              )}

              {board.meetingId && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Meeting ID</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-foreground/70 truncate flex-1">
                      {typeof board.meetingId === 'object' ? board.meetingId._id : board.meetingId}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                      const meetingIdStr = typeof board.meetingId === 'object' ? board.meetingId._id : board.meetingId
                      navigator.clipboard.writeText(meetingIdStr!)
                      toast.success("Meeting ID disalin")
                    }}>
                      <IconCopy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Board ID</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground/70 truncate flex-1">{board._id}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    navigator.clipboard.writeText(board._id)
                    toast.success("Board ID disalin")
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
