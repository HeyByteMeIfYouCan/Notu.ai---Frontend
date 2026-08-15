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
import { useEffect, useState } from "react";
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

// Global in-memory cache to prevent flickering / loader flash during page navigation
let globalPinnedMeetingsCache: PinnedMeeting[] | null = null;
let globalPinnedBoardsCache: PinnedBoard[] | null = null;

export function NavPinned() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { api, isReady } = useApiWithAuth();
  const [pinnedMeetings, setPinnedMeetings] = useState<PinnedMeeting[]>(
    globalPinnedMeetingsCache || []
  );
  const [pinnedBoards, setPinnedBoards] = useState<PinnedBoard[]>(
    globalPinnedBoardsCache || []
  );
  const [isLoading, setIsLoading] = useState(
    globalPinnedMeetingsCache === null && globalPinnedBoardsCache === null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ type: 'meeting' | 'board'; item: PinnedMeeting | PinnedBoard } | null>(null);

  useEffect(() => {
    if (isReady) {
      const needsLoading = globalPinnedMeetingsCache === null && globalPinnedBoardsCache === null;
      fetchPinnedItems(needsLoading);
    }
  }, [isReady]);

  // Subscribe to pin events for realtime sync
  useEffect(() => {
    const unsubscribe = pinEvents.subscribe((event) => {
      if (event.type === 'meeting') {
        if (event.pinned) {
          fetchPinnedItems(false);
        } else {
          setPinnedMeetings((prev) => {
            const next = prev.filter((m) => m._id !== event.id);
            globalPinnedMeetingsCache = next;
            return next;
          });
        }
      } else if (event.type === 'board') {
        if (event.pinned) {
          fetchPinnedItems(false);
        } else {
          setPinnedBoards((prev) => {
            const next = prev.filter((b) => b._id !== event.id);
            globalPinnedBoardsCache = next;
            return next;
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPinnedItems = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const [meetingsRes, boardsRes] = await Promise.all([
        api.getPinnedMeetings(),
        api.getPinnedBoards(),
      ]);
      
      // Handle API response structure
      const meetingsData = meetingsRes?.data || meetingsRes || [];
      const boardsData = boardsRes?.data || boardsRes || [];
      
      const nextMeetings = Array.isArray(meetingsData) ? meetingsData : [];
      const nextBoards = Array.isArray(boardsData) ? boardsData : [];

      globalPinnedMeetingsCache = nextMeetings;
      globalPinnedBoardsCache = nextBoards;

      setPinnedMeetings(nextMeetings);
      setPinnedBoards(nextBoards);
    } catch (error) {
      console.error("Failed to fetch pinned items:", error);
      if (globalPinnedMeetingsCache === null) setPinnedMeetings([]);
      if (globalPinnedBoardsCache === null) setPinnedBoards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpinMeeting = async (id: string) => {
    try {
      await api.toggleMeetingPin(id);
      setPinnedMeetings((prev) => {
        const next = prev.filter((m) => m._id !== id);
        globalPinnedMeetingsCache = next;
        return next;
      });
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
      setPinnedBoards((prev) => {
        const next = prev.filter((b) => b._id !== id);
        globalPinnedBoardsCache = next;
        return next;
      });
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

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus meeting ini?")) return;
    
    setDeletingId(id);
    try {
      await api.deleteMeeting(id);
      setPinnedMeetings((prev) => {
        const next = prev.filter((m) => m._id !== id);
        globalPinnedMeetingsCache = next;
        return next;
      });
      toast.success("Meeting berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus meeting");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteBoard = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus board ini?")) return;
    
    setDeletingId(id);
    try {
      await api.deleteBoard(id);
      setPinnedBoards((prev) => {
        const next = prev.filter((b) => b._id !== id);
        globalPinnedBoardsCache = next;
        return next;
      });
      toast.success("Board berhasil dihapus");
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
      <SidebarGroupLabel className="text-muted-foreground flex items-center gap-1.5">
        <IconPinFilled className="h-3 w-3" />
        PINNED
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
                  >
                    <Link
                      href={`/dashboard/meeting/${meeting._id}`}
                      className="flex items-center gap-2"
                    >
                      <IconVideo className="h-4 w-4 text-primary" />
                      <span className="truncate">{meeting.title}</span>
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
                            onClick={() => handleDeleteMeeting(meeting._id)}
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
                  >
                    <Link
                      href={`/dashboard/kanban/${board._id}`}
                      className="flex items-center gap-2"
                    >
                      <IconLayoutKanban className="h-4 w-4 text-emerald-500" />
                      <span className="truncate">{board.title || board.name}</span>
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
                            onClick={() => handleDeleteBoard(board._id)}
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
      
      {/* Info Dialog */}
      <Dialog open={!!infoDialog} onOpenChange={() => setInfoDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {infoDialog?.type === 'meeting' ? 'Informasi Meeting' : 'Informasi Board'}
            </DialogTitle>
          </DialogHeader>
          {infoDialog && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Judul</div>
                  <div className="text-sm font-semibold text-foreground">
                    {infoDialog.type === 'meeting' 
                      ? (infoDialog.item as PinnedMeeting).title 
                      : (infoDialog.item as PinnedBoard).title || (infoDialog.item as PinnedBoard).name}
                  </div>
                </div>

                {infoDialog.type === 'meeting' && (infoDialog.item as PinnedMeeting).platform && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Platform</div>
                    <div className="text-sm font-semibold text-foreground">{(infoDialog.item as PinnedMeeting).platform}</div>
                  </div>
                )}

                {infoDialog.item.userRole && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Role Anda</div>
                    <div className="text-sm font-semibold text-primary">{getRoleLabel(infoDialog.item.userRole)}</div>
                  </div>
                )}

                {infoDialog.item.createdAt && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Dibuat</div>
                    <div className="text-sm font-semibold text-foreground">
                      {new Date(infoDialog.item.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    {infoDialog.type === 'meeting' ? 'Meeting ID' : 'Board ID'}
                  </div>
                  <code className="text-xs font-mono text-foreground/70">{infoDialog.item._id}</code>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
}
