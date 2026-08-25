"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import MeetingCard from "@/components/custom/MeetingCard"
import { ModernPagination } from "@/components/custom/ModernPagination"
import { IconLoader2 } from "@tabler/icons-react"
import { Video, Mic, Upload, BarChart2 } from "lucide-react"
import { OnlineMeetingDialog } from "@/components/dialogs/online-meeting-dialog"
import { RealtimeMeetingDialog } from "@/components/dialogs/realtime-meeting-dialog"
import { useAuth, useApiWithAuth } from "@/hooks/use-auth"
import useListParams from "@/hooks/use-list-params"
import ListToolbar from "@/components/custom/ListToolbar"
import { normalizeMeetingsResponse } from "@/lib/meetings"
import { useRouter } from "next/navigation"
import { ApiError } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BotLiveTranscript } from "@/components/custom/BotLiveTranscript"

type QuickActionId = "online" | "realtime" | "upload" | "analytics"

interface QuickAction {
  id: QuickActionId
  eyebrow: string
  title: string
  description: string
  href?: "/dashboard/uploads" | "/dashboard/analytics"
  icon: any
  colorClass: string
}

const quickActions: readonly QuickAction[] = [
  {
    id: "online",
    eyebrow: "Meeting online",
    title: "Undang Notu ke Google Meet",
    description: "Tempel link meeting, lalu Notu akan membantu mencatat percakapan secara live.",
    icon: Video,
    colorClass: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10",
  },
  {
    id: "realtime",
    eyebrow: "Meeting di ruangan",
    title: "Mulai rekam dari mikrofon",
    description: "Sekali klik, obrolan langsung direkam dan diubah jadi transkrip.",
    icon: Mic,
    colorClass: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
  },
  {
    id: "upload",
    eyebrow: "Sudah rekaman?",
    title: "Upload file meeting",
    description: "Pilih audio atau video, lalu Notu akan mengubahnya menjadi notulen.",
    href: "/dashboard/uploads",
    icon: Upload,
    colorClass: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
  },
  {
    id: "analytics",
    eyebrow: "Lihat insight",
    title: "Lihat insight meeting",
    description: "Pelajari pola bicara, aktivitas, dan rangkuman dari meeting Anda.",
    href: "/dashboard/analytics",
    icon: BarChart2,
    colorClass: "text-primary bg-primary/10",
  },
]

// QuickActionArtwork removed

interface Meeting {
  _id: string
  title: string
  description?: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  type?: string
  // Derived/server-provided fields
  userRole?: 'owner' | 'editor' | 'viewer' | string
  isUpload?: boolean
  pinned?: boolean
  shareToken?: string
}

export default function Page() {
  const [isOnlineMeetingOpen, setIsOnlineMeetingOpen] = useState(false)
  const [isRealtimeMeetingOpen, setIsRealtimeMeetingOpen] = useState(false)
  const [isLiveTranscriptOpen, setIsLiveTranscriptOpen] = useState(false)
  const [meetingIdToView, setMeetingIdToView] = useState<string | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [gridCols, setGridCols] = useState<1 | 2>(2)

  const controls = useListParams({ defaultPageSize: 10 })
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch meetings on mount and when filter/page/search changes
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if ((meetings || []).length === 0) setIsLoadingMeetings(true)
        else controls.setIsFetching(true)

        const params: any = { ...controls.queryParams, search: controls.searchQuery }
        const response = await api.getMeetings(params as any)
        const { meetings: meetingsList, pagination } = normalizeMeetingsResponse(response, controls.pageSize)
        setMeetings(meetingsList)
        setTotalPages(pagination.totalPages || 1)
      } catch (error: any) {
        console.error("Error fetching meetings:", error)
        setMeetings([])
        // Surface LLM / OpenRouter rate-limit to user with friendly message
        if (error instanceof ApiError) {
          if (error.status === 429) {
            setLlmError('AI service rate-limited. Coba lagi sebentar atau tambahkan API key di Settings.');
          } else if (error.diagnostics && error.diagnostics.fallback) {
            setLlmError('AI service fallback occured. Hasil mungkin terbatas. Coba lagi atau periksa konfigurasi API.');
          } else {
            setLlmError(null);
          }
        } else {
          setLlmError(null);
        }
      } finally {
        setIsLoadingMeetings(false)
        controls.setIsFetching(false)
      }
    }

    if (!authLoading) {
      if (isReady) {
        fetchMeetings()
      } else {
        setIsLoadingMeetings(false)
      }
    }
  }, [isReady, authLoading, controls.page, controls.searchQuery, controls.pageSize, controls.filter, controls.type])

  // Reset to first page when filter, search, or meeting type changes
  useEffect(() => {
    controls.setPage(1)
  }, [controls.filter, controls.searchQuery, controls.type])

  // search debounce handled by useListParams

  // Format meeting data for MeetingCard
  const formatMeetingForCard = (meeting: Meeting) => ({
    id: meeting._id,
    tag: meeting.userRole === 'owner' ? '#Meeting saya' : '#Dibagikan',
    platform: meeting.platform || "Google Meet",
    date: new Date(meeting.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    title: meeting.title || "Meeting tanpa judul",
    description: meeting.description || "Tenang, Notu sedang menyiapkan meeting ini...",
    type: meeting.type || "online",
    status: meeting.status,
    userRole: meeting.userRole,
    isPinned: meeting.pinned || false,
    shareToken: meeting.shareToken,
    onViewLiveTranscript: (id: string) => {
      setMeetingIdToView(id)
      setIsLiveTranscriptOpen(true)
    },
  })

  // No client-side filtering; server returns filtered/paginated results.

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col bg-background">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-8">
              {/* Top welcome */}
              <div className="px-4 lg:px-8">
                <p className="mb-2 text-sm font-semibold tracking-wide text-primary/80 uppercase">
                  {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">
                  Selamat datang, {user?.name?.split(' ')[0] || 'Pengguna'} 👋
                </h2>
                <p className="text-base text-muted-foreground mt-2">Meeting mana yang ingin Anda mulai hari ini?</p>
              </div>

              {/* Quick action cards */}
              <div className="px-4 lg:px-8">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Pilih Workflow</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Pilih yang paling pas, Notu bantu lanjutannya.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 @4xl/main:grid-cols-4 @2xl/main:grid-cols-2">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    const cardContent = (
                      <div className="flex h-full flex-col justify-between p-6">
                        <div className="flex items-start justify-between mb-8">
                           <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.colorClass} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300`}>
                              <IconComponent className="h-5 w-5" strokeWidth={2} />
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{action.eyebrow}</span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-[1.05rem] font-semibold tracking-tight text-foreground">{action.title}</h3>
                          <p className="text-sm leading-relaxed text-muted-foreground text-balance">{action.description}</p>
                        </div>
                      </div>
                    )

                    const cardClassName = "group relative isolate flex flex-col w-full h-full min-h-[180px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

                    if (action.href) {
                      return (
                        <Link key={action.id} href={action.href} className={cardClassName}>
                          {cardContent}
                        </Link>
                      )
                    }

                    return (
                      <button
                        key={action.id}
                        type="button"
                        className={cardClassName}
                        onClick={() => {
                          if (action.id === "online") setIsOnlineMeetingOpen(true)
                          if (action.id === "realtime") setIsRealtimeMeetingOpen(true)
                        }}
                      >
                        {cardContent}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Meeting History Section */}
              <div className="px-4 lg:px-8 mt-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Meeting terbaru Anda</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Cari meeting lama atau lanjut buka hasil yang sudah siap.</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6">
                  <ListToolbar controls={controls as any} gridCols={gridCols} setGridCols={setGridCols} />
                </div>

                {/* Meeting Cards Grid */}
                {isLoadingMeetings ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-[var(--foreground)]">Belum ada meeting</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Mari mulai meeting pertama Anda melalui pilihan di atas.</p>
                  </div>
                ) : (
                  <>
                    {/* LLM / OpenRouter error banner */}
                      {llmError && (
                        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-800">
                          <strong>AI Service:</strong> {llmError}
                        </div>
                      )}
                    <div className={`grid gap-4 ${gridCols === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                      {meetings.map((meeting) => (
                        <MeetingCard key={meeting._id} data={formatMeetingForCard(meeting)} />
                      ))}
                    </div>
                    {/* Pagination controls */}
                    <ModernPagination
                      currentPage={controls.page}
                      totalPages={totalPages}
                      totalItems={totalPages * controls.pageSize}
                      itemsPerPage={controls.pageSize}
                      onPageChange={(p) => controls.setPage(p)}
                      className="mt-6"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
        <OnlineMeetingDialog
          isOpen={isOnlineMeetingOpen}
          onClose={() => setIsOnlineMeetingOpen(false)}
        />
        <RealtimeMeetingDialog
          isOpen={isRealtimeMeetingOpen}
          onClose={() => setIsRealtimeMeetingOpen(false)}
        />
        
        {/* Live Transcript Modal */}
        <Dialog open={isLiveTranscriptOpen} onOpenChange={setIsLiveTranscriptOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Transkrip live</DialogTitle>
            </DialogHeader>
            {meetingIdToView && (
              <BotLiveTranscript 
                meetingId={meetingIdToView}
                onComplete={() => {
                  setIsLiveTranscriptOpen(false)
                  setMeetingIdToView(null)
                }}
                onError={(err) => {
                  console.error('Live transcript error:', err)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
    </SidebarProvider>
  )
}
