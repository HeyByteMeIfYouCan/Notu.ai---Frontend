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
import { IconMenu2, IconShare, IconCopy, IconLink, IconPlus, IconDownload, IconTrash, IconLoader2, IconPencil, IconInfoCircle, IconChecks } from "@tabler/icons-react"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import { OnlinePresence } from "@/components/custom/OnlinePresence"
import { getPermissions, getAssignableRoles, getRoleLabel } from "@/lib/permissions"

interface MeetingHeaderProps {
  title: string
  description: string
  meetingId: string
  shareToken: string | null
  user: any
  collaborators: any[]
  onGenerateShareLink: () => Promise<void>
  onUpdateRole: (userId: string, role: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onExport: (format: 'json' | 'txt' | 'srt' | 'vtt' | 'mp3' | 'mp4') => Promise<void>
  onDeleteMeeting: () => Promise<void>
  onUpdateMeeting: (data: { title?: string; description?: string }) => Promise<void>
  isVideoFile: boolean
  audioUrl: string | null
  summary: string
  meeting: any // Full meeting object for details
  userRole?: string
}

export function MeetingHeader({
  title,
  description,
  meetingId,
  shareToken,
  user,
  collaborators,
  onGenerateShareLink,
  onUpdateRole,
  onRemoveMember,
  onExport,
  onDeleteMeeting,
  onUpdateMeeting,
  isVideoFile,
  audioUrl,
  summary,
  meeting,
  userRole
}: MeetingHeaderProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editDesc, setEditDesc] = useState(description)

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
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <IconMenu2 className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-lg font-medium truncate text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground truncate max-w-2xl">{description || 'No description available'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Online Presence Avatars */}
          <OnlinePresence
            resourceType="meeting"
            resourceId={meetingId}
            currentUserId={user?.id}
            collaborators={collaborators}
            owner={meeting?.userId}
            maxAvatars={4}
          />
          
          {permissions.canShare && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[var(--primary)] hover:brightness-90 text-[var(--primary-foreground)] rounded-full px-4 h-9 flex items-center gap-2" 
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
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                          <div className="flex items-center gap-2">
                            {meeting?.userId?.image || (meeting?.userId?._id === user?.id && user?.image) ? (
                              <img src={meeting?.userId?.image || user?.image} className="w-8 h-8 rounded-full" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                {(meeting?.userId?.name || user?.name || 'O')[0]}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{meeting?.userId?.name || user?.name} {meeting?.userId?._id === user?.id && "(Anda)"}</span>
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
          
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => {
            const shareUrl = shareToken ? `${window.location.origin}/dashboard/join/meeting/${shareToken}` : window.location.href;
            navigator.clipboard.writeText(shareUrl)
            toast.success(shareToken ? "Link kolaborasi disalin" : "Link meeting disalin")
          }}>
            <IconLink className="h-4 w-4" />
          </Button>

          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <IconInfoCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Meeting Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Platform</span>
                    <p className="text-sm">{meeting?.platform || 'Direct Upload'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Type</span>
                    <p className="text-sm capitalize">{meeting?.type || 'Standard'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Duration</span>
                    <p className="text-sm">
                      {meeting?.duration 
                        ? `${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s` 
                        : 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Created At</span>
                    <p className="text-sm">{meeting?.createdAt ? new Date(meeting.createdAt).toLocaleString() : '-'}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">File Information</span>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium truncate ml-4 max-w-[200px]">{meeting?.originalFile?.originalName || meeting?.originalFile?.filename || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{meeting?.originalFile?.size ? (meeting.originalFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mime Type:</span>
                      <span>{meeting?.originalFile?.mimetype || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Speakers ({meeting?.transcription?.speakers?.length || 0})</span>
                  </div>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {meeting?.transcription?.speakers && meeting.transcription.speakers.length > 0 ? (
                      meeting.transcription.speakers.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-muted last:border-0">
                          <span className="text-sm font-medium">{s.speaker}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {idx === 0 ? 'Primary' : 'Participant'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No speaker data available</p>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="rounded-lg h-9 px-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v16H4V4z"/>
            </svg>
            <span className="text-sm">Notion</span>
            <span className="text-xs text-muted-foreground">Connect</span>
          </Button>

          <div className="h-4 w-px bg-border mx-1"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-[var(--primary)]/5 hover:text-[var(--primary)] text-muted-foreground transition-all duration-200">
                <IconDownload className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-border/40 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Format Ekspor</div>
              <DropdownMenuItem onClick={() => onExport('txt')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-[var(--primary)]/5 focus:bg-[var(--primary)]/5 text-sm group">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-[var(--primary)] transition-colors"></div>
                <span>Teks (.txt)</span>
              </DropdownMenuItem>
              {isVideoFile && (
                <DropdownMenuItem onClick={() => onExport('mp4')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-[var(--primary)]/5 focus:bg-[var(--primary)]/5 text-sm group">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-[var(--primary)] transition-colors"></div>
                  <span>Video (.mp4)</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onExport('mp3')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-[var(--primary)]/5 focus:bg-[var(--primary)]/5 text-sm group">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-[var(--primary)] transition-colors"></div>
                <span>Audio (.mp3)</span>
              </DropdownMenuItem>
              <div className="h-px bg-border/50 my-1"></div>
              <DropdownMenuItem onClick={() => onExport('json')} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-[var(--primary)]/5 focus:bg-[var(--primary)]/5 text-sm group italic">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[var(--primary)] transition-colors"></div>
                <span className="text-muted-foreground">Advanced (JSON)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
            navigator.clipboard.writeText(summary)
            toast.success("Summary berhasil disalin")
          }}>
            <IconCopy className="h-4 w-4" />
          </Button>

          {permissions.canDelete && (
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
              <div className="text-sm font-medium text-foreground">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{user?.plan || 'Free'}</div>
            </div>
            {user?.image ? (
              <img src={user.image} className="w-9 h-9 rounded-full border border-border" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-indigo-400 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.[0] || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
