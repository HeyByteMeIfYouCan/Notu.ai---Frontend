"use client"

/**
 * Tailwind v4 Safelist for dynamic backend colors:
 * bg-purple-500 bg-emerald-500 bg-indigo-500 bg-rose-500 bg-amber-500
 * bg-slate-400 bg-slate-100 bg-red-500 bg-orange-500 bg-blue-400 bg-rose-500
 */

import { IconChevronDown, IconChevronRight, IconChecks, IconTarget, IconCalendar, IconUser } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IconPlus, IconLayoutKanban, IconTrash, IconLoader2 } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { formatDueDate } from "@/lib/dateUtils"
import { getPermissions } from "@/lib/permissions"
import type { CollaboratorRole, TaskCandidate } from "@/lib/types"

interface TalkTimeData {
  speaker: string
  words: number
  talks: number
  total: number
}

interface TopicKeyword {
  name: string
  color: string
}

interface MeetingAnalyticsProps {
  talkTime: TalkTimeData[]
  topics: TopicKeyword[]
  actionItems: TaskCandidate[]
  hasSyncedTasks: boolean
  hasBoard?: boolean | null
  onGenerateKanban: () => Promise<void>
  onDeleteKanban: () => Promise<void>
  boardId?: string | null
  userRole?: CollaboratorRole | 'owner' | string | null
  meetingId: string
}

export function MeetingAnalytics({
  talkTime,
  topics,
  actionItems,
  hasSyncedTasks,
  onGenerateKanban,
  onDeleteKanban,
  boardId, 
  userRole, 
  hasBoard,
  meetingId
}: MeetingAnalyticsProps) {
  const router = useRouter()
  const [isDeletingBoard, setIsDeletingBoard] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    talktime: false,
    topics: false,
    action: false
  })

  // Permission checks
  const permissions = useMemo(() => getPermissions(userRole || undefined), [userRole])

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleDeleteBoard = async () => {
    toast.error("Hapus board ini?", {
      description: "Seluruh tugas di dalamnya juga akan dihapus.",
      action: {
        label: "Hapus",
        onClick: async () => {
          setIsDeletingBoard(true)
          await onDeleteKanban()
          setIsDeletingBoard(false)
          toast.success("Board sudah dihapus")
        }
      },
      duration: 5000
    })
  }

  const sortedTalkTime = [...talkTime].sort((a, b) => b.total - a.total)

  return (
    <div className="w-80 border-r border-border/50 hidden lg:flex lg:flex-col bg-card shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
      <div className="p-6 border-b border-border/40 shrink-0">
        {/* Analytics Header */}
        <div className="flex items-center justify-between group">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            Analytics
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
            onClick={() => router.push(`/dashboard/analytics/detail/${meetingId}`)}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* TALKTIME Section */}
        <div className="mb-8">
          <button 
            onClick={() => toggleSection('talktime')}
            className="flex items-center justify-between w-full mb-4 group hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">TALKTIME</h3>
            <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${collapsedSections.talktime ? '-rotate-90' : ''}`} />
          </button>
          
          {!collapsedSections.talktime && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-4 gap-2 text-[10px] font-bold px-2 uppercase tracking-wider text-muted-foreground/60 mb-2">
                <div>Speaker</div>
                <div>Kata</div>
                <div>Bicara</div>
                <div className="text-right">Total</div>
              </div>

              <div className="space-y-2">
                {sortedTalkTime.length > 0 ? (
                  sortedTalkTime.map((item, index) => {
                    const circumference = 2 * Math.PI * 8
                    const dashOffset = circumference - (circumference * item.total / 100)
                    
                    // Generate a color for each speaker
                    const colors = [
                      'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 
                      'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 
                      'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'
                    ]
                    const textColors = [
                      'text-indigo-600 dark:text-indigo-400', 'text-emerald-600 dark:text-emerald-400', 'text-purple-600 dark:text-purple-400', 
                      'text-rose-600 dark:text-rose-400', 'text-amber-600 dark:text-amber-400', 'text-blue-600 dark:text-blue-400', 
                      'text-pink-600 dark:text-pink-400', 'text-cyan-600 dark:text-cyan-400', 'text-orange-600 dark:text-orange-400'
                    ]
                    const bgColor = colors[index % colors.length]
                    const textColor = textColors[index % textColors.length]
                    
                    // Check if speaker follows SPEAKER_N pattern
                    const speakerPattern = /^SPEAKER[_\s]*(\d+)$/i;
                    const match = item.speaker.match(speakerPattern);
                    
                    // Display logic: show number if SPEAKER_N, else show first letter
                    const displayText = match ? match[1] : item.speaker.charAt(0).toUpperCase();
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className="group/speaker relative grid cursor-default grid-cols-4 items-center gap-2 rounded-xl p-2.5 transition-all hover:shadow-md bg-card border border-border/50 shadow-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform group-hover/speaker:scale-105 flex-shrink-0`}>
                                {displayText}
                              </div>
                              <span className={`truncate text-sm font-semibold ${textColor}`}>
                                {item.speaker}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-muted-foreground group-hover/speaker:text-foreground transition-colors">
                              {item.words}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground group-hover/speaker:text-foreground transition-colors">
                              {item.talks}x
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-xs font-bold ${textColor}`}>
                                {item.total}%
                              </span>
                              <div className="relative w-5 h-5 flex-shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet">
                                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3"/>
                                  <circle 
                                    cx="10" 
                                    cy="10" 
                                    r="8" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    className={textColor}
                                    strokeWidth="3" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={16} className="bg-popover text-popover-foreground px-4 py-3 rounded-xl shadow-xl ring-1 ring-border z-[100] whitespace-nowrap">
                          <div className="font-bold mb-2 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${bgColor}`}></div>
                            {item.speaker}
                          </div>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between gap-4"><span>Kata diucapkan:</span> <span className="font-semibold text-foreground">{item.words}</span></div>
                            <div className="flex justify-between gap-4"><span>Kali berbicara:</span> <span className="font-semibold text-foreground">{item.talks}x</span></div>
                            <div className="flex justify-between gap-4"><span>Total waktu:</span> <span className="font-semibold text-foreground">{item.total}%</span></div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center rounded-xl bg-muted/20 border border-dashed">Tidak ada data</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border/40 my-8"></div>

        {/* TOPIK / KEYWORD Section */}
        <div className="mb-8">
          <button 
            onClick={() => toggleSection('topics')}
            className="flex items-center justify-between w-full mb-4 group hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">TOPIK / KEYWORD</h3>
            <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${collapsedSections.topics ? '-rotate-90' : ''}`} />
          </button>
          
          {!collapsedSections.topics && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {topics.length > 0 ? (
                topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-1.5 group cursor-default bg-card hover:bg-accent/50 border border-border/50 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                    <div className={`w-2 h-2 rounded-full ${topic.color || 'bg-slate-400'}`}></div>
                    <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{topic.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic text-center w-full py-2">Tidak ada topik</div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-border/40 my-8"></div>

        {/* ACTION ITEMS / TASKS Unified Section */}
        <div className="pb-10">
          <button 
            onClick={() => toggleSection('action')}
            className="flex items-center justify-between w-full mb-5 group hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">ACTION ITEMS</h3>
            <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${collapsedSections.action ? '-rotate-90' : ''}`} />
          </button>

          {!collapsedSections.action && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {actionItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-primary leading-tight">
                        {hasSyncedTasks 
                          ? "Tersinkronisasi dengan Kanban!" 
                          : "Siap dibuat Kanban Board"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-7 rounded-lg border border-primary/10 bg-background px-3 text-[10px] font-bold uppercase tracking-tight text-primary transition-[background-color,color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary hover:text-primary-foreground motion-reduce:transition-none"
                        onClick={() => {
                          if (hasBoard) {
                            const raw = actionItems?.[0]?.boardId || (boardId ? String(boardId) : null);
                            if (raw) router.push(`/dashboard/kanban/${raw}`);
                          } else {
                            if (!permissions.canSyncTasks) {
                              toast.error('Anda belum memiliki akses untuk membuat board.');
                              return;
                            }
                            onGenerateKanban();
                          }
                        }}
                      >
                        {hasBoard ? "Buka" : "Buat"}
                      </Button>
                      {hasBoard && permissions.canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={handleDeleteBoard}
                          disabled={isDeletingBoard}
                        >
                          {isDeletingBoard ? <IconLoader2 className="h-3 w-3 animate-spin" /> : <IconTrash className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    {actionItems.map((item: TaskCandidate, index: number) => {
                        const colors = ['bg-purple-500', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500'];
                        const colorClass = item.priority === 'urgent' ? 'bg-rose-500' : item.priority === 'high' ? 'bg-orange-500' : colors[index % colors.length];
                        
                        // Use centralized date utility for consistent formatting
                        const dateStr = formatDueDate(item.dueDate);
                        const assigneeLabel = item.assigneeName || (typeof item.assignee === 'string' ? item.assignee : item.assignee?.name);

                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div className="flex items-start justify-between group cursor-default">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${colorClass} transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-150 motion-reduce:transition-none motion-reduce:transform-none`}></div>
                                  <div className="text-[13px] font-medium leading-tight text-foreground group-hover:text-primary transition-colors truncate">{item.title}</div>
                                </div>
                                <span className="text-[11px] font-bold text-foreground/70 ml-3 bg-muted px-1.5 py-0.5 rounded-md min-w-[32px] text-center border border-border/10">{dateStr}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[260px] p-3 bg-background-2 text-foreground ring-2 ring-accent">
                              <div className="space-y-1.5">
                                <div className="font-semibold text-sm">{item.title}</div>
                                {item.description && (
                                  <div className="text-xs opacity-80 line-clamp-3">{item.description}</div>
                                )}
                                <div className="flex items-center gap-2 pt-1 text-[10px] opacity-70">
                                  {item.priority && (
                                    <span className="uppercase font-bold flex items-center gap-1"><IconTarget className="w-3 h-3" /> {item.priority}</span>
                                  )}
                                  {item.dueDate && (
                                    <span className="flex items-center gap-1"><IconCalendar className="w-3 h-3" /> {new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  )}
                                </div>
                                {assigneeLabel && (
                                  <div className="text-[10px] opacity-70 flex items-center gap-1"><IconUser className="w-3 h-3" /> {assigneeLabel}</div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                    })}
                  </div>
                </>
              )}

              {actionItems.length === 0 && (
                <div className="text-xs text-muted-foreground py-10 text-center bg-muted/20 rounded-xl border border-dashed italic">
                  Tidak ada action items terdeteksi
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
