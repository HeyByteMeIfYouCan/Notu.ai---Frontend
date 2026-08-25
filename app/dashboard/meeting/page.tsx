"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { IconMicrophone, IconPlus, IconLoader2 } from "@tabler/icons-react"
import { SiteHeader } from "@/components/site-header"
import MeetingCard from "@/components/custom/MeetingCard"
import { ModernPagination } from "@/components/custom/ModernPagination"
import { useApiWithAuth } from "@/hooks/use-auth"
import useListParams from "@/hooks/use-list-params"
import ListToolbar from "@/components/custom/ListToolbar"
import { normalizeMeetingsResponse } from "@/lib/meetings"
import { ApiError } from "@/lib/api"
import { OnlineMeetingDialog } from "@/components/dialogs/online-meeting-dialog"
import { RealtimeMeetingDialog } from "@/components/dialogs/realtime-meeting-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BotLiveTranscript } from "@/components/custom/BotLiveTranscript"

interface Meeting {
  _id: string
  title: string
  description?: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  type?: string
  userRole?: 'owner' | 'editor' | 'viewer' | string
  isUpload?: boolean
  pinned?: boolean
  shareToken?: string
}

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [isOnlineMeetingOpen, setIsOnlineMeetingOpen] = useState(false)
  const [isRealtimeMeetingOpen, setIsRealtimeMeetingOpen] = useState(false)
  const [isLiveTranscriptOpen, setIsLiveTranscriptOpen] = useState(false)
  const [meetingIdToView, setMeetingIdToView] = useState<string | null>(null)
  const [gridCols, setGridCols] = useState<1 | 2>(2)

  // default to all (online + realtime) meetings on this page and do not expose upload
  const controls = useListParams({ defaultPageSize: 10, defaultType: 'all' })
  const { api, isReady } = useApiWithAuth()

  // Fetch meetings when controls change
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (meetings.length === 0) setIsLoading(true)
        else controls.setIsFetching(true)

        // For meeting page, when 'all' is selected we want online+realtime (exclude uploads)
        const params: any = { ...controls.queryParams, search: controls.searchQuery }
        if (controls.type === 'all') {
          params.type = 'online,realtime'
        }
        const response = await api.getMeetings(params as any)
        const { meetings: meetingsList, pagination } = normalizeMeetingsResponse(response, controls.pageSize)
        setMeetings(meetingsList)
        setTotalPages(pagination.totalPages || 1)
      } catch (error) {
        console.error("Error fetching meetings:", error)
        setMeetings([])
        if (error instanceof ApiError) {
          if (error.status === 429) setLlmError('AI service rate-limited. Coba lagi sebentar atau tambahkan API key di Settings.');
          else if (error.diagnostics && error.diagnostics.fallback) setLlmError('AI service fallback occured. Hasil mungkin terbatas.');
        }
      } finally {
        setIsLoading(false)
        controls.setIsFetching(false)
      }
    }

    if (isReady) fetchMeetings()
    else setIsLoading(false)
  }, [isReady, controls.page, controls.searchQuery, controls.pageSize, controls.filter, controls.type])

  // reset to first page when search/filter/type changes
  useEffect(() => {
    controls.setPage(1)
  }, [controls.filter, controls.searchQuery, controls.type])

  const formatMeetingForCard = (meeting: Meeting) => ({
    id: meeting._id,
    tag: meeting.userRole === 'owner' ? '#Meeting saya' : (meeting.userRole ? `#${meeting.userRole}` : '#Meeting'),
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

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-6">
              {/* Hero Section */}
              <div className="px-4 lg:px-6 mb-2">
                <div className="mb-6">
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">
                    Meeting jalan, catatan tetap aman.
                  </h2>
                  <p className="text-base text-muted-foreground mt-2 max-w-2xl">
                    Pilih cara Anda memulai. Undang Notu ke platform meeting online Anda, atau rekam diskusi langsung dari mikrofon. Kami urus sisanya.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Action Card 1: Google Meet */}
                  <button 
                    onClick={() => setIsOnlineMeetingOpen(true)}
                    className="group relative isolate flex flex-col w-full h-full min-h-[180px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex h-full flex-col justify-between p-6">
                      <div className="flex items-start justify-between mb-8">
                         <div className="flex h-11 w-11 items-center justify-center rounded-xl text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300">
                            <IconPlus className="h-5 w-5" strokeWidth={2} />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Meeting online</span>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[1.05rem] font-semibold tracking-tight text-foreground">Undang Notu ke Google Meet</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground text-balance">
                          Tempel link meeting, lalu Notu akan membantu mencatat percakapan secara live.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Action Card 2: Microphone */}
                  <button 
                    onClick={() => setIsRealtimeMeetingOpen(true)}
                    className="group relative isolate flex flex-col w-full h-full min-h-[180px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex h-full flex-col justify-between p-6">
                      <div className="flex items-start justify-between mb-8">
                         <div className="flex h-11 w-11 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300">
                            <IconMicrophone className="h-5 w-5" strokeWidth={2} />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Meeting di ruangan</span>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[1.05rem] font-semibold tracking-tight text-foreground">Mulai rekam dari mikrofon</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground text-balance">
                          Sekali klik, obrolan langsung direkam dan diubah jadi transkrip.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Meeting List */}
              <div className="px-4 lg:px-6">
                <h2 className="mb-1 text-xl font-semibold tracking-[-0.02em] text-foreground">Semua meeting Anda</h2>
                <p className="mb-6 text-sm text-[var(--muted-foreground)]">Cari, buka lagi, atau lanjut cek meeting yang masih diproses.</p>

                <div className="mb-6">
                  <ListToolbar controls={controls as any} gridCols={gridCols} setGridCols={setGridCols} typeOptions={[{ value: 'all', label: 'Semua Jenis' }, { value: 'online', label: 'Online' }, { value: 'realtime', label: 'Realtime' }]} />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-card/30 rounded-2xl border border-dashed border-border/60">
                    <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-5 ring-1 ring-primary/10">
                      <IconMicrophone className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="text-xl font-bold tracking-tight text-foreground mb-2">Belum ada meeting yang tercatat</p>
                    <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                      Ruang kerja Anda masih kosong. Mari mulai dengan merekam diskusi atau mengundang Notu ke panggilan online.
                    </p>
                  </div>
                ) : (
                  <>
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
