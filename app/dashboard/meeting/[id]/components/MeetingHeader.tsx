"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { IconMenu2, IconShare, IconCopy, IconLink, IconPlus, IconDownload, IconTrash, IconLoader2, IconPencil, IconInfoCircle, IconChecks, IconChevronLeft, IconChartBar } from "@tabler/icons-react"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { OnlinePresence } from "@/components/custom/OnlinePresence"
import { getPermissions, getAssignableRoles, getRoleLabel } from "@/lib/permissions"

interface MeetingHeaderProps {
  title: string
  description: string
  meetingId: string
  shareToken: string | null
  user: any
  collaborators: any[]
  participants: any[]  // Add participants
  onGenerateShareLink: () => Promise<void>
  onUpdateRole: (userId: string, role: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onExport: (format: 'json' | 'txt' | 'srt' | 'vtt' | 'mp3' | 'mp4') => Promise<void>
  onDeleteMeeting: () => Promise<void>
  onUpdateMeeting: (data: { title?: string; description?: string }) => Promise<void>
  isVideoFile: boolean
  audioUrl: string | null
  summary: string
  userRole?: string
  createdAt?: string
  duration?: number
  segments?: any[]
}

export function MeetingHeader({
  title,
  description,
  meetingId,
  shareToken,
  user,
  collaborators,
  participants,
  onGenerateShareLink,
  onUpdateRole,
  onRemoveMember,
  onExport,
  onDeleteMeeting,
  onUpdateMeeting,
  isVideoFile,
  audioUrl,
  summary,
  userRole,
  createdAt,
  duration,
  segments
}: MeetingHeaderProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editDesc, setEditDesc] = useState(description)
  
  const router = useRouter()

  // Get permissions based on user role
  const permissions = useMemo(() => getPermissions(userRole), [userRole])
  const assignableRoles = useMemo(() => getAssignableRoles(userRole), [userRole])

  useEffect(() => {
    setEditTitle(title)
  }, [title])

  useEffect(() => {
    setEditDesc(description)
  }, [description])

  const handleDelete = async () => {
    if (confirm("Hapus meeting ini? Seluruh data terkait, termasuk board, tidak dapat dipulihkan.")) {
      setIsDeleting(true)
      await onDeleteMeeting()
      setIsDeleting(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[color-mix(in_oklch,var(--card)_94%,transparent)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 flex-1 mr-4 overflow-hidden">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 shrink-0 hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
            onClick={() => router.back()}
          >
            <IconChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="truncate text-xl font-semibold tracking-[-0.025em] text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground truncate max-w-2xl">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Online Presence */}
          <OnlinePresence
            resourceType="meeting"
            resourceId={meetingId}
            currentUserId={user?.id}
            collaborators={participants || collaborators}
            maxAvatars={4}
          />
          
          {/* Share Button */}
          {permissions.showShareButton && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="h-9 bg-primary px-4 font-medium text-primary-foreground transition-[background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/90 motion-reduce:transition-none"
                  onClick={() => onGenerateShareLink()}
                >
                  <IconShare className="h-4 w-4 mr-2" />
                  Bagikan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Bagikan meeting ini</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Link buat kolaborasi</label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={shareToken ? `${window.location.origin}/dashboard/join/meeting/${shareToken}` : "Link sedang disiapkan..."}
                        className="bg-muted border-border"
                      />
                      <Button size="icon" variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground" onClick={() => {
                        if (shareToken) {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboard/join/meeting/${shareToken}`)
                          toast.success("Link meeting sudah disalin")
                        }
                      }}>
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground">Yang punya akses</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {/* Owner */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                          {user?.image ? (
                            <img src={user.image} className="w-8 h-8 rounded-full" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {(user?.name || 'O')[0]}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{user?.name || 'Pemilik'} (Anda)</span>
                            <span className="text-xs text-muted-foreground">Pemilik meeting</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Collaborators */}
                      {collaborators?.map((col) => (
                        <div key={col.user._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3">
                            {col.user.image ? (
                              <img src={col.user.image} className="w-8 h-8 rounded-full" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                                {col.user.name?.[0] || 'U'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{col.user.name}</span>
                              <span className="text-xs text-muted-foreground">{col.user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <select 
                              value={col.role}
                              onChange={(e) => onUpdateRole(col.user._id, e.target.value)}
                              className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:ring-2 focus:ring-primary cursor-pointer text-foreground hover:bg-accent"
                              disabled={!permissions.canManageCollaborators}
                            >
                              {assignableRoles.map(r => (
                                <option key={r} value={r}>{getRoleLabel(r)}</option>
                              ))}
                            </select>
                            {permissions.canManageCollaborators && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onRemoveMember(col.user._id)}>
                                <IconPlus className="h-4 w-4 rotate-45" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Copy Link */}
          {permissions.showCopyLink && (
            <Button variant="outline" size="icon" className="h-9 w-9 border-border hover:bg-accent" onClick={() => {
              const shareUrl = shareToken ? `${window.location.origin}/dashboard/join/meeting/${shareToken}` : window.location.href
              navigator.clipboard.writeText(shareUrl)
              toast.success("Link meeting sudah disalin")
            }}>
              <IconLink className="h-4 w-4" />
            </Button>
          )}

          {/* Info Button */}
          <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors">
                <IconInfoCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Tentang meeting ini</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Judul</div>
                    <div className="text-sm font-semibold text-foreground">{title}</div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Deskripsi</div>
                    <div className="text-sm text-foreground">{description || 'No description'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Dibuat</div>
                      <div className="text-sm font-semibold text-foreground">
                        {createdAt ? new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Durasi</div>
                      <div className="text-sm font-semibold text-foreground">
                        {duration ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '-'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Segmen</div>
                      <div className="text-sm font-semibold text-foreground">{segments?.length || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Kolaborator</div>
                      <div className="text-sm font-semibold text-foreground">{collaborators?.length || 0}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Akses Anda</div>
                    <div className="text-sm font-semibold text-primary">{getRoleLabel(userRole || 'owner')}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Meeting ID</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground/70 truncate flex-1">{meetingId}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => {
                        navigator.clipboard.writeText(meetingId)
                        toast.success("Meeting ID copied")
                      }}>
                        <IconCopy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Detail Analytics Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            onClick={() => router.push(`/dashboard/analytics/detail/${meetingId}`)}
            title="Detail Analytics"
          >
            <IconChartBar className="h-4 w-4" />
          </Button>

          {/* Export Dropdown */}
          {permissions.showExportDropdown && (
            <>
              <div className="h-4 w-px bg-border mx-1"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors">
                    <IconDownload className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">Download sebagai</div>
                  <DropdownMenuItem onClick={() => onExport('txt')} className="cursor-pointer hover:bg-accent">
                    <span className="text-sm">Text (.txt)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('srt')} className="cursor-pointer hover:bg-accent">
                    <span className="text-sm">Subtitle (.srt)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('vtt')} className="cursor-pointer hover:bg-accent">
                    <span className="text-sm">WebVTT (.vtt)</span>
                  </DropdownMenuItem>
                  
                  {permissions.canExportMedia && (
                    <>
                      <div className="h-px bg-border my-1"></div>
                      {isVideoFile && (
                        <DropdownMenuItem onClick={() => onExport('mp4')} className="cursor-pointer hover:bg-accent">
                          <span className="text-sm">Video (.mp4)</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onExport('mp3')} className="cursor-pointer hover:bg-accent">
                        <span className="text-sm">Audio (.mp3)</span>
                      </DropdownMenuItem>
                      <div className="h-px bg-border my-1"></div>
                      <DropdownMenuItem onClick={() => onExport('json')} className="cursor-pointer hover:bg-accent">
                        <span className="text-sm text-muted-foreground">Advanced (JSON)</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Delete Button */}
          {permissions.showDeleteButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconTrash className="h-4 w-4" />}
            </Button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-foreground">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{user?.plan || 'Free'}</div>
            </div>
            {user?.image ? (
              <img src={user.image} className="w-9 h-9 rounded-full border border-border" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
