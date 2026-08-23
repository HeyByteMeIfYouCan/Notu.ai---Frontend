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
}

const quickActions: readonly QuickAction[] = [
  {
    id: "online",
    eyebrow: "Meeting online",
    title: "Undang Notu ke Google Meet",
    description: "Tempel link meeting, lalu Notu akan membantu mencatat percakapan secara live.",
  },
  {
    id: "realtime",
    eyebrow: "Meeting di ruangan",
    title: "Mulai rekam dari mikrofon",
    description: "Sekali klik, obrolan langsung direkam dan diubah jadi transkrip.",
  },
  {
    id: "upload",
    eyebrow: "Sudah memiliki rekaman?",
    title: "Upload file meeting",
    description: "Pilih audio atau video Anda, lalu Notu akan mengubahnya menjadi notulen yang mudah dicari.",
    href: "/dashboard/uploads",
  },
  {
    id: "analytics",
    eyebrow: "Lihat insight",
    title: "Lihat insight meeting",
    description: "Pelajari pola bicara, aktivitas, dan rangkuman dari meeting Anda.",
    href: "/dashboard/analytics",
  },
]

function QuickActionArtwork({ id }: { id: QuickActionId }) {
  const iconTransition = "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.12] group-focus-visible:scale-[1.12] motion-reduce:transition-none motion-reduce:transform-none"
  const fieldTransition = "transition-[transform,opacity] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none"

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[46%] overflow-hidden" aria-hidden="true">
      <div
        className={`absolute inset-0 ${fieldTransition} group-hover:scale-[1.04] group-focus-visible:scale-[1.04]`}
        style={{
          background:
            id === "online"
              ? "radial-gradient(circle at 70% 42%, color-mix(in oklch, var(--primary) 28%, transparent) 0, transparent 42%), linear-gradient(130deg, transparent 18%, color-mix(in oklch, var(--chart-3) 16%, transparent) 100%)"
              : id === "realtime"
                ? "radial-gradient(ellipse at 72% 50%, color-mix(in oklch, var(--chart-2) 24%, transparent) 0, transparent 52%), linear-gradient(105deg, transparent 10%, color-mix(in oklch, var(--primary) 13%, transparent) 100%)"
                : id === "upload"
                  ? "linear-gradient(145deg, transparent 28%, color-mix(in oklch, var(--chart-4) 20%, transparent) 72%, color-mix(in oklch, var(--primary) 16%, transparent) 100%)"
                  : "radial-gradient(ellipse at 74% 48%, color-mix(in oklch, var(--chart-5) 24%, transparent) 0, transparent 50%), linear-gradient(155deg, transparent 30%, color-mix(in oklch, var(--chart-1) 16%, transparent) 100%)",
        }}
      />

      {id === "online" && (
        <svg viewBox="0 0 220 150" className="absolute inset-0 h-full w-full text-[var(--primary)]">
          <path d="M20 112 80 74l54 21 66-60" fill="none" stroke="currentColor" strokeOpacity=".16" strokeWidth="1.5" />
          <path d="M16 128 76 90l59 22 72-45" fill="none" stroke="currentColor" strokeOpacity=".09" strokeWidth="1" />
          <g className={`${fieldTransition} origin-center group-hover:rotate-[-3deg] group-focus-visible:rotate-[-3deg]`}>
            <circle cx="80" cy="74" r="5" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
            <circle cx="134" cy="95" r="4" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
            <circle cx="200" cy="35" r="3" fill="currentColor" />
          </g>
        </svg>
      )}

      {id === "realtime" && (
        <svg viewBox="0 0 220 150" className="absolute inset-0 h-full w-full text-[var(--chart-2)]">
          {[38, 54, 70, 86, 102, 118].map((y, index) => (
            <path
              key={y}
              d={`M18 ${y} C58 ${y - 20 + index * 3}, 82 ${y + 18 - index * 2}, 126 ${y} S184 ${y - 14}, 220 ${y - 2}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.07 + index * 0.018}
              strokeWidth="1.4"
              className={`${fieldTransition} group-hover:translate-x-2 group-focus-visible:translate-x-2`}
            />
          ))}
        </svg>
      )}

      {id === "upload" && (
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((plane) => (
            <span
              key={plane}
              className={`absolute bottom-[-30%] h-[90%] w-px origin-bottom rotate-[32deg] bg-[var(--chart-4)] opacity-[.10] ${fieldTransition} group-hover:-translate-y-3 group-focus-visible:-translate-y-3`}
              style={{ right: `${20 + plane * 20}%`, transitionDelay: `${plane * 45}ms` }}
            />
          ))}
        </div>
      )}

      {id === "analytics" && (
        <svg viewBox="0 0 220 150" className="absolute inset-0 h-full w-full text-[var(--chart-5)]">
          <path d="M16 118c30-9 31-44 65-43 30 1 38 29 68 19 26-9 31-40 69-43" fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth="1.4" className={`${fieldTransition} group-hover:translate-y-[-5px] group-focus-visible:translate-y-[-5px]`} />
          <path d="M12 132c41-5 45-35 75-34 33 1 43 25 72 13 21-9 29-30 60-35" fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="1" />
          <circle cx="149" cy="94" r="3" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}

      <div className="absolute right-[17%] top-1/2 flex size-16 -translate-y-1/2 items-center justify-center rounded-[1.35rem] border border-[color-mix(in_oklch,var(--border)_72%,transparent)] bg-[color-mix(in_oklch,var(--card)_78%,transparent)] text-[var(--foreground)] shadow-[0_18px_45px_-32px_color-mix(in_oklch,var(--foreground)_50%,transparent)] backdrop-blur-sm">
        {/* Icon paths adapted from UXWing. Source pages: video-call, microphone, upload-file, analytics. License: https://uxwing.com/license/ */}
        {id === "online" && (
          <svg viewBox="0 0 122.88 111.73" className={`size-7 ${iconTransition}`} fill="currentColor">
            <path d="M30.93 45.92c3.77 6.81 8.12 13.34 13.78 19.31 5.66 6 12.7 11.46 21.83 16.11.67.34 1.31.34 1.89.1.88-.34 1.75-1.04 2.63-1.92.67-.68 1.52-1.75 2.39-2.93 3.5-4.62 7.85-10.34 13.98-7.48.13.07.24.13.37.2l20.45 11.76c.07.03.13.1.2.13 2.7 1.85 3.81 4.72 3.84 7.95 0 3.3-1.21 7.01-3 10.14-2.36 4.14-5.83 6.87-9.84 8.69-3.81 1.75-8.05 2.7-12.13 3.3-6.4.94-12.4.34-18.53-1.55-6-1.85-12.03-4.92-18.63-9l-.47-.3c-3.03-1.89-6.3-3.91-9.5-6.3C28.43 85.27 16.47 72.46 8.69 58.38 2.15 46.56-1.42 33.79.53 21.63 1.61 14.96 4.48 8.89 9.46 4.88 13.81 1.38 19.67-.54 27.25.13c.88.07 1.65.57 2.05 1.31l13.11 22.17c1.92 2.49 2.16 4.95 1.11 7.41-.88 2.02-2.63 3.88-5.02 5.63-.71.61-1.55 1.21-2.43 1.85-2.93 2.12-6.27 4.58-5.12 7.48l-.02-.06Z" />
            <path d="M70.93 1.67h29.54a5.37 5.37 0 0 1 5.35 5.35v5.7l17.05-10.25v32.35l-17.05-9.2v7.42a5.37 5.37 0 0 1-5.35 5.35H70.93a5.37 5.37 0 0 1-5.36-5.35V7.02a5.37 5.37 0 0 1 5.36-5.35Z" opacity=".55" />
          </svg>
        )}
        {id === "realtime" && (
          <svg viewBox="0 0 83.44 122.88" className={`size-7 ${iconTransition}`} fill="currentColor">
            <path d="M45.04 95.45v24.11a3.32 3.32 0 1 1-6.64 0V95.45C16.92 93.74 0 75.77 0 53.87a3.32 3.32 0 1 1 6.64 0c0 19.34 15.74 35.08 35.08 35.08S76.8 73.21 76.8 53.87a3.32 3.32 0 1 1 6.64 0c0 21.91-16.92 39.87-38.4 41.58ZM41.94 0a23.22 23.22 0 0 1 23.19 23.19v30a23.19 23.19 0 0 1-46.38 0v-30A23.22 23.22 0 0 1 41.94 0Zm0 6.65A16.56 16.56 0 0 0 25.4 23.19v30a16.54 16.54 0 0 0 33.08 0v-30A16.56 16.56 0 0 0 41.94 6.65Z" />
          </svg>
        )}
        {id === "upload" && (
          <svg viewBox="0 0 113.79 122.88" className={`size-7 ${iconTransition}`} fill="currentColor">
            <path fillRule="evenodd" d="M65.59 67.32h38.82a9.41 9.41 0 0 1 9.38 9.38v36.79a9.41 9.41 0 0 1-9.38 9.39H65.59a9.41 9.41 0 0 1-9.38-9.39V76.7a9.41 9.41 0 0 1 9.38-9.38ZM60 11.56l19.73 18.51H60V11.56ZM20.87 54a2.24 2.24 0 0 0 0 4.46h38.78a2.24 2.24 0 0 0 0-4.46H20.87Zm0 16a2.24 2.24 0 0 0 0 4.45h24.8V70h-24.8Zm0 15.91a2.24 2.24 0 0 0 0 4.46h24.8v-4.46h-24.8ZM90.72 32.72a3.28 3.28 0 0 0-2.39-3.17L59.23 1.21A3.27 3.27 0 0 0 56.69 0H5.91A5.91 5.91 0 0 0 0 5.91v101.21A5.91 5.91 0 0 0 5.91 113h39.85v-6.6H6.61V6.57h46.76v26.79a3.32 3.32 0 0 0 3.32 3.31h27.43v21.62h6.6V32.72Zm6.45 65.1a2.4 2.4 0 0 0 2.06-1c1.08-1.62-.4-3.22-1.42-4.35-2.91-3.19-9.49-9-10.92-10.66a2.37 2.37 0 0 0-3.72 0c-1.49 1.73-8.43 7.86-11.19 11-1 1.08-2.15 2.56-1.15 4a2.42 2.42 0 0 0 2.07 1h5.17v9.27A2.92 2.92 0 0 0 81 110h8.1a2.92 2.92 0 0 0 2.9-2.91v-9.27h5.17Z" />
          </svg>
        )}
        {id === "analytics" && (
          <svg viewBox="0 0 107.22 122.88" className={`size-7 ${iconTransition}`} fill="currentColor">
            <path d="M92.36 29.38v60.2c0 10.72-3.72 17.34-11.36 17.34H23v5.14a4.88 4.88 0 0 0 4.88 4.94h68.56a4.9 4.9 0 0 0 4.88-4.88V34.26a4.92 4.92 0 0 0-4.88-4.88h-4.08ZM47.78 77.26l14.95.25a15.38 15.38 0 0 1-7 12.87l-7.95-13.12Zm-.78-4.44-.22-17.98 1.15.09a19.34 19.34 0 0 1 18.55 18.32l.09 1.11-19.47-.51-.1-1.03Zm-4.23 2.93 8.53 14.32a17.64 17.64 0 0 1-8.53 2.22 16.54 16.54 0 1 1-.7-33.07l.7 16.53ZM10.79 0h70.7a10.82 10.82 0 0 1 10.79 10.79v12.68h4.16a10.81 10.81 0 0 1 10.78 10.79v77.83a10.81 10.81 0 0 1-10.78 10.79H27.88a10.82 10.82 0 0 1-10.79-10.79v-5.17h-6.3A10.82 10.82 0 0 1 0 96.14V10.79A10.82 10.82 0 0 1 10.79 0Zm0 5.91a4.88 4.88 0 0 0-4.88 4.88v30.13h80.46V10.79a4.88 4.88 0 0 0-4.88-4.88H10.79Zm-4.88 40.92v49.31a4.88 4.88 0 0 0 4.88 4.86h70.33c3.5 0 5.25-2.94 5.25-8.79V46.83H5.91Z" />
          </svg>
        )}
      </div>
    </div>
  )
}

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

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-6">
              {/* Top welcome */}
              <div className="px-4 lg:px-6">
                <h2 className="text-3xl font-bold text-[var(--foreground)]">Selamat datang, {user?.name?.split(' ')[0] || 'Pengguna'} 👋</h2>
                <p className="text-sm text-muted-foreground">Meeting mana yang ingin Anda mulai hari ini?</p>
              </div>

              {/* Quick action cards */}
              <div className="px-4 lg:px-6">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Pilih workflow</p>
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">Mau mulai dari mana?</h3>
                  </div>
                  <p className="hidden max-w-xs text-right text-xs leading-5 text-[var(--muted-foreground)] sm:block">Pilih yang paling pas, Notu bantu lanjutannya.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {quickActions.map((action) => {
                    const cardContent = (
                      <>
                        <QuickActionArtwork id={action.id} />
                        <span className="relative z-10 flex min-h-36 max-w-[68%] flex-col justify-between gap-7 p-5 sm:min-h-40 sm:p-6">
                          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{action.eyebrow}</span>
                          <span className="space-y-1.5">
                            <span className="block text-base font-semibold tracking-[-0.018em] text-[var(--foreground)] sm:text-[1.05rem]">{action.title}</span>
                            <span className="block text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">{action.description}</span>
                          </span>
                        </span>
                      </>
                    )

                    const cardClassName = "group relative isolate block w-full overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--card)] text-left outline-none transition-[border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[color-mix(in_oklch,var(--primary)_35%,var(--border))] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] motion-reduce:transition-none"

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
              <div className="px-4 lg:px-6">
                <h2 className="mb-2 text-xl font-bold text-[var(--foreground)]">Meeting terbaru Anda</h2>
                <p className="mb-6 text-sm text-[var(--muted-foreground)]">Cari meeting lama atau lanjut buka hasil yang sudah siap.</p>

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
