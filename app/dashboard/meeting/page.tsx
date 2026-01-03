"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { IconSearch, IconMicrophone, IconPlus, IconLoader2 } from "@tabler/icons-react"
import { SiteHeader } from "@/components/site-header"
import MeetingCard from "@/components/custom/MeetingCard"
import Pagination from "@/components/custom/Pagination"
import { useApiWithAuth } from "@/hooks/use-auth"
import useListParams from "@/hooks/use-list-params"
import ListToolbar from "@/components/custom/ListToolbar"
import { normalizeMeetingsResponse } from "@/lib/meetings"
import { ApiError } from "@/lib/api"

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
    tag: meeting.userRole === 'owner' ? '#My Meeting' : (meeting.userRole ? `#${meeting.userRole}` : '#Meeting'),
    platform: meeting.platform || "Google Meet",
    date: new Date(meeting.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    title: meeting.title || "Untitled Meeting",
    description: meeting.description || "Meeting sedang diproses...",
    type: meeting.type || "online",
    status: meeting.status,
    userRole: meeting.userRole,
    isPinned: meeting.pinned || false,
    shareToken: meeting.shareToken,
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
              {/* Generate Your Meeting Section (preserved) */}
              <div className="px-4 lg:px-6">
                <div className="mb-8 flex flex-col items-center">
                  <div className="mb-6 flex items-center bg-white py-8 px-8 rounded-[6px] shadow-lg gap-2">
                    <div className="h-4 w-4 rounded-full bg-[var(--primary)]"></div>
                    <div className="h-3 w-16 rounded-full bg-gray-300"></div>
                    <div className="h-3 w-24 rounded-full bg-gray-300"></div>
                    <div className="h-3 w-32 rounded-full bg-gray-300"></div>
                  </div>

                  <h1 className="mb-4 text-3xl font-bold text-[var(--foreground)]">Generate Your Meeting...</h1>
                  <p className="mb-6 text-sm text-[var(--muted-foreground)]">Berikan Link Google Meet Anda, Dan Biarkan Notu Meringkas Poin Poin Meeting Anda</p>

                  <div className="flex gap-4">
                    <Button className="bg-[var(--primary)] hover:brightness-90 text-[var(--primary-foreground)] px-6 py-3">
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add To Live Meet
                    </Button>
                    <Button className="bg-muted text-[var(--primary)] px-6 py-3">
                      <IconMicrophone className="mr-2 h-4 w-4" />
                      Realtime Meet
                    </Button>
                  </div>
                </div>
              </div>

              {/* Meeting History Section */}
              <div className="px-4 lg:px-6">
                <h2 className="mb-2 text-xl font-bold text-[var(--foreground)]">Meeting History</h2>
                <p className="mb-6 text-sm text-[var(--muted-foreground)]">Cari Meeting Anda Yang Telah Dibuat</p>

                <div className="mb-6">
                  <ListToolbar controls={controls as any} typeOptions={[{ value: 'all', label: 'Semua Jenis' }, { value: 'online', label: 'Online' }, { value: 'realtime', label: 'Realtime' }]} />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-[var(--foreground)]">Belum ada meeting</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Mulai dengan membuat meeting baru</p>
                  </div>
                ) : (
                  <>
                    {llmError && (
                      <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-800">
                        <strong>AI Service:</strong> {llmError}
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      {meetings.map((meeting) => (
                        <MeetingCard key={meeting._id} data={formatMeetingForCard(meeting)} />
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-4">
                      <Pagination page={controls.page} totalPages={totalPages} onPageChange={(p) => controls.setPage(p)} />
                      {controls.isFetching && <IconLoader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
