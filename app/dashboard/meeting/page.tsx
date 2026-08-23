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
              {/* Generate Your Meeting Section */}
              <div className="px-4 lg:px-6">
                <div className="relative mb-8 overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] px-6 py-8 sm:px-9 sm:py-10">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[48%] opacity-90" style={{ background: "radial-gradient(ellipse at 70% 48%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%)" }} />
                  <svg aria-hidden="true" viewBox="0 0 420 210" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 text-[var(--primary)] sm:block">
                    <path d="M8 170c72-7 98-58 162-54 60 4 80 47 142 23 38-15 59-58 108-69" fill="none" stroke="currentColor" strokeOpacity=".13" strokeWidth="1.5" />
                    <path d="M2 193c90-2 113-46 172-41 64 5 82 38 144 17 42-15 55-44 102-54" fill="none" stroke="currentColor" strokeOpacity=".07" />
                    <circle cx="169" cy="116" r="5" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
                    <circle cx="312" cy="139" r="4" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
                  </svg>

                  <div className="relative z-10 max-w-xl">
                    <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Siap mulai?</p>
                    <h1 className="mb-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">Meeting jalan, catatan tetap aman.</h1>
                    <p className="mb-7 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">Undang Notu ke Google Meet atau rekam langsung dari mikrofon. Anda dapat fokus berdiskusi, sementara Notu membantu menyiapkan catatannya.</p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button className="h-11 bg-primary px-5 text-primary-foreground transition-[background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/90 motion-reduce:transition-none" onClick={() => setIsOnlineMeetingOpen(true)}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Undang Notu ke Google Meet
                      </Button>
                      <Button variant="outline" className="h-11 border-[var(--border)] bg-[color-mix(in_oklch,var(--card)_80%,transparent)] px-5 text-[var(--foreground)] transition-[background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[color-mix(in_oklch,var(--primary)_28%,var(--border))] hover:bg-[var(--muted)] motion-reduce:transition-none" onClick={() => setIsRealtimeMeetingOpen(true)}>
                        <IconMicrophone className="mr-2 h-4 w-4" />
                        Rekam langsung dari mikrofon
                      </Button>
                    </div>
                  </div>
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
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-[var(--foreground)]">Belum ada meeting</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Mari undang Notu ke meeting pertama Anda.</p>
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
