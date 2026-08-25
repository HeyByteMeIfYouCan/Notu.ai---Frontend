"use client";

import {
  IconDots,
  IconExternalLink,
  IconShare,
  IconPin,
  IconPinFilled,
  IconVideo,
  IconLayoutKanban,
  IconLoader2,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useApiWithAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { pinEvents } from "@/lib/pinEvents";
import { getRoleLabel, type UserRole } from "@/lib/permissions";

interface PinnedMeeting {
  _id: string;
  title: string;
  pinnedAt: string;
  userRole?: UserRole;
  shareToken?: string;
  platform?: string;
  status?: string;
  createdAt?: string;
}

interface PinnedBoard {
  _id: string;
  title: string;
  name?: string;
  pinnedAt: string;
  meetingId?: { _id: string; title: string } | string;
  userRole?: UserRole;
  createdAt?: string;
  shareToken?: string;
}

export function NavPinned() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { api, isReady } = useApiWithAuth();
  const [pinnedMeetings, setPinnedMeetings] = useState<PinnedMeeting[]>([]);
  const [pinnedBoards, setPinnedBoards] = useState<PinnedBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ type: 'meeting' | 'board'; item: PinnedMeeting | PinnedBoard } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'meeting' | 'board'; id: string; title: string } | null>(null);

  const fetchPinnedItems = useCallback(async () => {
    if (!isReady) return;
    try {
      setIsLoading(true);
      const [meetingsRes, boardsRes] = await Promise.all([
        api.getPinnedMeetings(),
        api.getPinnedBoards(),
      ]);
      
      // Handle API response structure
      const meetingsData = meetingsRes?.data || meetingsRes || [];
      const boardsData = boardsRes?.data || boardsRes || [];
      
      setPinnedMeetings(Array.isArray(meetingsData) ? meetingsData : []);
      setPinnedBoards(Array.isArray(boardsData) ? boardsData : []);
    } catch (error) {
      console.error("Failed to fetch pinned items:", error);
      setPinnedMeetings([]);
      setPinnedBoards([]);
    } finally {
      setIsLoading(false);
    }
  }, [api, isReady]);

  useEffect(() => {
    if (isReady) {
      fetchPinnedItems();
    }
  }, [isReady, fetchPinnedItems]);

  // Subscribe to pin events for realtime sync
  useEffect(() => {
    const unsubscribe = pinEvents.subscribe((event) => {
      if (event.type === 'meeting') {
        if (event.pinned) {
          // Refetch to get the new pinned meeting
          fetchPinnedItems();
        } else {
          // Remove unpinned meeting from local state
          setPinnedMeetings((prev) => prev.filter((m) => m._id !== event.id));
        }
      } else if (event.type === 'board') {
        if (event.pinned) {
          // Refetch to get the new pinned board
          fetchPinnedItems();
        } else {
          // Remove unpinned board from local state
          setPinnedBoards((prev) => prev.filter((b) => b._id !== event.id));
        }
      }
    });

    return () => unsubscribe();
  }, [fetchPinnedItems]);

  const handleUnpinMeeting = async (id: string) => {
    try {
      await api.toggleMeetingPin(id);
      setPinnedMeetings((prev) => prev.filter((m) => m._id !== id));
      // Emit event for card sync
      pinEvents.emit({ type: 'meeting', id, pinned: false });
      toast.success("Berhasil unpin meeting");
    } catch (error) {
      toast.error("Gagal menghapus pin");
    }
  };

  const handleUnpinBoard = async (id: string) => {
    try {
      await api.toggleBoardPin(id);
      setPinnedBoards((prev) => prev.filter((b) => b._id !== id));
      // Emit event for card sync
      pinEvents.emit({ type: 'board', id, pinned: false });
      toast.success("Berhasil unpin kanban");
    } catch (error) {
      toast.error("Gagal menghapus pin");
    }
  };

  const handleCopyMeetingLink = (meeting: PinnedMeeting) => {
    const url = meeting.shareToken
      ? `${window.location.origin}/dashboard/join/meeting/${meeting.shareToken}`
      : `${window.location.origin}/dashboard/meeting/${meeting._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kolaborasi meeting disalin");
  };

  const handleCopyBoardLink = (board: PinnedBoard) => {
    const url = board.shareToken
      ? `${window.location.origin}/dashboard/join/board/${board.shareToken}`
      : `${window.location.origin}/dashboard/kanban/${board._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kolaborasi kanban disalin");
  };

  const handleDeleteMeeting = (meeting: PinnedMeeting) => {
    setDeleteConfirm({ type: 'meeting', id: meeting._id, title: meeting.title });
  };

  const handleDeleteBoard = (board: PinnedBoard) => {
    setDeleteConfirm({ type: 'board', id: board._id, title: board.title || board.name || 'Untitled' });
  };

  const confirmDeleteMeeting = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteMeeting(id);
      setPinnedMeetings((prev) => prev.filter((m) => m._id !== id));
      toast.success("Meeting berhasil dihapus");
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus meeting");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteBoard = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteBoard(id);
      setPinnedBoards((prev) => prev.filter((b) => b._id !== id));
      toast.success("Board berhasil dihapus");
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus board");
    } finally {
      setDeletingId(null);
    }
  };

  const meetings = Array.isArray(pinnedMeetings) ? pinnedMeetings : [];
  const boards = Array.isArray(pinnedBoards) ? pinnedBoards : [];
  const hasItems = meetings.length > 0 || boards.length > 0;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground/70 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 mt-2">
        <IconPinFilled className="h-3.5 w-3.5" />
        Pinned Items
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : !hasItems ? (
          <div className="px-3 py-2 text-xs text-muted-foreground italic">
            Belum ada pinned item. Pin meeting atau board untuk akses cepat.
          </div>
        ) : (
          <SidebarMenu>
            {/* Pinned Meetings */}
            {meetings.map((meeting) => {
              const isOwnerOrAdmin = meeting.userRole === 'owner' || meeting.userRole === 'admin';
              
              return (
                <SidebarMenuItem key={`meeting-${meeting._id}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/dashboard/meeting/${meeting._id}`}
                    className="h-9 transition-colors hover:bg-muted/60 rounded-lg group"
                  >
                    <Link
                      href={`/dashboard/meeting/${meeting._id}`}
                      className="flex items-center gap-2.5 px-3"
                    >
                      <IconVideo className="h-4 w-4 shrink-0 text-primary/80 group-hover:text-primary transition-colors" />
                      <span className="truncate text-sm font-medium">{meeting.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:bg-primary/10 data-[state=open]:text-primary rounded-sm">
                        <IconDots className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-44 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      {/* Buka - Everyone */}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/meeting/${meeting._id}`}>
                          <IconExternalLink className="h-4 w-4" />
                          <span>Buka</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Bagikan Link - Owner/Admin only */}
                      {isOwnerOrAdmin && (
                        <DropdownMenuItem onClick={() => handleCopyMeetingLink(meeting)}>
                          <IconShare className="h-4 w-4" />
                          <span>Bagikan Link Meeting</span>
                        </DropdownMenuItem>
                      )}
                      
                      {/* Unpin Meeting - Everyone */}
                      <DropdownMenuItem onClick={() => handleUnpinMeeting(meeting._id)}>
                        <IconPinFilled className="h-4 w-4" />
                        <span>Unpin Meeting</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Info - Everyone */}
                      <DropdownMenuItem onClick={() => setInfoDialog({ type: 'meeting', item: meeting })}>
                        <IconInfoCircle className="h-4 w-4" />
                        <span>Info</span>
                      </DropdownMenuItem>
                      
                      {/* Hapus - Owner/Admin only */}
                      {isOwnerOrAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMeeting(meeting)}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingId === meeting._id}
                          >
                            {deletingId === meeting._id ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconTrash className="h-4 w-4" />
                            )}
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })}

            {/* Pinned Boards */}
            {boards.map((board) => {
              const isOwnerOrAdmin = board.userRole === 'owner' || board.userRole === 'admin';
              
              return (
                <SidebarMenuItem key={`board-${board._id}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/dashboard/kanban/${board._id}`}
                    className="h-9 transition-colors hover:bg-muted/60 rounded-lg group"
                  >
                    <Link
                      href={`/dashboard/kanban/${board._id}`}
                      className="flex items-center gap-2.5 px-3"
                    >
                      <IconLayoutKanban className="h-4 w-4 shrink-0 text-emerald-500/80 group-hover:text-emerald-500 transition-colors" />
                      <span className="truncate text-sm font-medium">{board.title || board.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:bg-primary/10 data-[state=open]:text-primary rounded-sm">
                        <IconDots className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-44 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      {/* Buka - Everyone */}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/kanban/${board._id}`}>
                          <IconExternalLink className="h-4 w-4" />
                          <span>Buka</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Ke Meeting - if board has meetingId */}
                      {board.meetingId && (
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/meeting/${typeof board.meetingId === 'object' ? board.meetingId._id : board.meetingId}`}>
                            <IconVideo className="h-4 w-4" />
                            <span>Ke Meeting</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      {/* Bagikan Link - Owner/Admin only */}
                      {isOwnerOrAdmin && (
                        <DropdownMenuItem onClick={() => handleCopyBoardLink(board)}>
                          <IconShare className="h-4 w-4" />
                          <span>Bagikan Link Kanban</span>
                        </DropdownMenuItem>
                      )}
                      
                      {/* Unpin Board - Everyone */}
                      <DropdownMenuItem onClick={() => handleUnpinBoard(board._id)}>
                        <IconPinFilled className="h-4 w-4" />
                        <span>Unpin Kanban</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Info - Everyone */}
                      <DropdownMenuItem onClick={() => setInfoDialog({ type: 'board', item: board })}>
                        <IconInfoCircle className="h-4 w-4" />
                        <span>Info</span>
                      </DropdownMenuItem>
                      
                      {/* Hapus - Owner/Admin only */}
                      {isOwnerOrAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBoard(board)}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingId === board._id}
                          >
                            {deletingId === board._id ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconTrash className="h-4 w-4" />
                            )}
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
      
      <Dialog open={!!infoDialog} onOpenChange={(open) => !open && setInfoDialog(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-border/60 shadow-2xl">
          <div className="bg-gradient-to-b from-muted/50 to-background px-6 py-5 border-b border-border/40">
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <IconInfoCircle className="h-5 w-5 text-primary" />
              {infoDialog?.type === 'meeting' ? 'Detail Meeting' : 'Detail Kanban'}
            </DialogTitle>
          </div>
          {infoDialog && (
            <div className="px-6 py-5">
              <div className="flex flex-col gap-4 text-sm">
                <div className="grid grid-cols-[100px_1fr] items-start gap-3">
                  <span className="text-muted-foreground font-medium mt-0.5">Judul</span>
                  <span className="text-foreground font-medium leading-snug">
                    {infoDialog.type === 'meeting' 
                      ? (infoDialog.item as PinnedMeeting).title 
                      : (infoDialog.item as PinnedBoard).title || (infoDialog.item as PinnedBoard).name}
                  </span>
                </div>

                <div className="my-1 h-px bg-border/40" />

                <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <span className="text-muted-foreground font-medium">Platform</span>
                  <span className="text-foreground">
                    {infoDialog.type === 'meeting' && (infoDialog.item as PinnedMeeting).platform ? (infoDialog.item as PinnedMeeting).platform : 'Sistem Notu'}
                  </span>
                </div>
                {infoDialog.item.createdAt && (
                  <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                    <span className="text-muted-foreground font-medium">Dibuat</span>
                    <span className="text-foreground">
                      {new Date(infoDialog.item.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}
                {infoDialog.item.userRole && (
                  <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                    <span className="text-muted-foreground font-medium">Akses</span>
                    <div className="flex items-center">
                      <span className="bg-primary/10 text-primary rounded-full font-medium px-2.5 py-0.5 text-xs">
                        {getRoleLabel(infoDialog.item.userRole)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="my-1 h-px bg-border/40" />

                <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <span className="text-muted-foreground font-medium">
                    {infoDialog.type === 'meeting' ? 'Meeting ID' : 'Board ID'}
                  </span>
                  <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded-md border border-border/50 truncate">
                    {infoDialog.item._id}
                  </code>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus {deleteConfirm?.type === 'meeting' ? 'Meeting' : 'Kanban'}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteConfirm?.type === 'meeting' ? 'meeting' : 'board'} <strong className="text-foreground">{deleteConfirm?.title}</strong>? Data yang telah dihapus tidak dapat dipulihkan kembali.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={!!deletingId} className="cursor-pointer">
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (deleteConfirm?.type === 'meeting') {
                  confirmDeleteMeeting(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'board') {
                  confirmDeleteBoard(deleteConfirm.id);
                }
              }} 
              disabled={!!deletingId} 
              className="cursor-pointer"
            >
              {!!deletingId ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
              Hapus Permanen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
}
