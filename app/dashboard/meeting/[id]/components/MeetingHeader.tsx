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
import { IconMenu2, IconShare, IconCopy, IconLink, IconPlus, IconDownload, IconTrash, IconLoader2, IconPencil, IconInfoCircle, IconChecks, IconChevronLeft } from "@tabler/icons-react"
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
  userRole
}: MeetingHeaderProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
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
    if (confirm("Apakah Anda yakin ingin menghapus meeting ini? Semua data terkait termasuk Kanban board akan terhapus.")) {
      setIsDeleting(true)
      await onDeleteMeeting()
      setIsDeleting(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
          {/* Back button to dashboard */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/dashboard/meeting')}
          >
            <IconChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-lg font-semibold truncate text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground truncate max-w-2xl">{description || 'No description available'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Online Presence Avatars - Always show */}
          <OnlinePresence
            resourceType="meeting"
            resourceId={meetingId}
            currentUserId={user?.id}
            collaborators={participants || collaborators}
            maxAvatars={4}
          />
          
          {/* Share Button - Admin+ only */}
          {permissions.showShareButton && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-4 h-9 flex items-center gap-2 font-semibold transition-opacity" 
                       onClick={() => onGenerateShareLink()}>
                  <IconShare className="h-4 w-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Meeting</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link Akses Collab (Logged in Only)</label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={shareToken ? `${window.location.origin}/dashboard/join/meeting/${shareToken}` : "Link belum digenerate..."} 
                        className="bg-muted"
                      />
                      <Button size="icon" variant="outline" onClick={() => {
                        if (shareToken) {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboard/join/meeting/${shareToken}`)
                          toast.success("Link disalin")
                        }
                      }}>
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-medium">Manajemen Member</h3>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                        {/* Owner Section */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2">
                            {user?.image ? (
                              <img src={user.image} className="w-8 h-8 rounded-full" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {(user?.name || 'O')[0]}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user?.name || 'Owner'} (Anda)</span>
                              <span className="text-xs text-muted-foreground">Owner</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Collaborators */}
                        {collaborators?.map((col) => (
                          <div key={col.user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                            <div className="flex items-center gap-2">
                              {col.user.image ? (
                                <img src={col.user.image} className="w-8 h-8 rounded-full" alt="" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
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
                                className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer text-muted-foreground hover:text-foreground"
                                disabled={!permissions.canManageCollaborators}
                              >
                                {assignableRoles.map(r => (
                                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                                ))}
                              </select>
                              {permissions.canManageCollaborators && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveMember(col.user._id)}>
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
          
          {/* Copy Link - Editor+ only */}
          {permissions.showCopyLink && (
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => {
              const shareUrl = shareToken ? `${window.location.origin}/dashboard/join/meeting/${shareToken}` : window.location.href
              navigator.clipboard.writeText(shareUrl)
              toast.success(shareToken ? "Link kolaborasi disalin" : "Link meeting disalin")
            }}>
              <IconLink className="h-4 w-4" />
            </Button>
          )}

          {/* Info Dialog moved to MeetingTranscript component */}

          {/* Notion Connect - Admin+ only */}
          {permissions.showNotionConnect && (
            <Button variant="outline" className="rounded-lg h-9 px-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v16H4V4z"/>
              </svg>
              <span className="text-sm">Notion</span>
              <span className="text-xs text-muted-foreground">Connect</span>
            </Button>
          )}

          {/* Export Dropdown - Everyone can export, but media only for editor+ */}
          {permissions.showExportDropdown && (
            <>
              <div className="h-4 w-px bg-border mx-1"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all duration-200">
                    <IconDownload className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-border/40 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-2 py-1.5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Format Ekspor</div>
                  <DropdownMenuItem onClick={() => onExport('txt')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 text-sm group">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-primary transition-colors"></div>
                    <span>Teks (.txt)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('srt')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 text-sm group">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:bg-primary transition-colors"></div>
                    <span>Subtitle (.srt)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('vtt')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 text-sm group">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 group-hover:bg-primary transition-colors"></div>
                    <span>WebVTT (.vtt)</span>
                  </DropdownMenuItem>
                  
                  {/* Media exports only for editor+ */}
                  {permissions.canExportMedia && (
                    <>
                      <div className="h-px bg-border/50 my-1"></div>
                      {isVideoFile && (
                        <DropdownMenuItem onClick={() => onExport('mp4')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 text-sm group">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-primary transition-colors"></div>
                          <span>Video (.mp4)</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onExport('mp3')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 text-sm group">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-primary transition-colors"></div>
                        <span>Audio (.mp3)</span>
                      </DropdownMenuItem>
                      <div className="h-px bg-border/50 my-1"></div>
                      <DropdownMenuItem onClick={() => onExport('json')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 text-sm group italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors"></div>
                        <span className="text-muted-foreground">Advanced (JSON)</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Copy Summary - Editor+ only */}
          {permissions.showEditActions && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
              navigator.clipboard.writeText(summary)
              toast.success("Summary berhasil disalin")
            }}>
              <IconCopy className="h-4 w-4" />
            </Button>
          )}

          {/* Delete Button - Owner only */}
          {permissions.showDeleteButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconTrash className="h-4 w-4" />}
            </Button>
          )}

          <div className="flex items-center gap-2 ml-2">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-extrabold">{user?.plan || 'Free'}</div>
            </div>
            {user?.image ? (
              <img src={user.image} className="w-9 h-9 rounded-full border border-border shadow-sm" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-semibold shadow-sm">
                {user?.name?.[0] || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
