"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MeetingCard from "@/components/custom/MeetingCard"
import Pagination from "@/components/custom/Pagination"
import { IconCamera, IconMicrophone, IconFileUpload, IconChartBar, IconSearch, IconDotsVertical, IconChevronRight, IconChevronDown, IconList, IconGrid4x4, IconLoader2, IconLayoutGrid } from "@tabler/icons-react"
import { OnlineMeetingDialog } from "@/components/dialogs/online-meeting-dialog"
import { RealtimeMeetingDialog } from "@/components/dialogs/realtime-meeting-dialog"
import { useAuth, useApiWithAuth } from "@/hooks/use-auth"
import useListParams from "@/hooks/use-list-params"
import ListToolbar from "@/components/custom/ListToolbar"
import { normalizeMeetingsResponse } from "@/lib/meetings"
import { useRouter } from "next/navigation"
import { ApiError } from "@/lib/api"

const quickActions = [
  {
    title: "Take Notes From Online Meeting",
    description: "Using Online Bot For Google Meet",
    icon: IconCamera,
    color: "bg-[var(--primary)]/10",
  },
  {
    title: "Take Notes From Realtime Meeting",
    description: "Using Online Bot For Google Meet",
    icon: IconMicrophone,
    color: "bg-[var(--primary)]/10",
  },
  {
    title: "Take Notes From Upload File",
    description: "Using Online Bot For Google Meet",
    icon: IconFileUpload,
    color: "bg-[var(--primary)]/10",
  },
  {
    title: "Analytics Your Meeting",
    description: "Using Online Bot For Google Meet",
    icon: IconChartBar,
    color: "bg-[var(--primary)]/10",
  },
]

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
  summarySnippet?: string
  isUpload?: boolean
}

export default function Page() {
  const [isOnlineMeetingOpen, setIsOnlineMeetingOpen] = useState(false)
  const [isRealtimeMeetingOpen, setIsRealtimeMeetingOpen] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)

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
    status: meeting.status
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
                <h2 className="text-3xl font-bold text-[var(--foreground)]">Welcome Abroad, {user?.name?.split(' ')[0] || 'User'}</h2>
                <p className="text-sm text-muted-foreground">Notu Siap Untuk Menjadi Asisten Anda😊</p>
              </div>

              {/* Quick action cards */}
              <div className="px-4 lg:px-6">
                <h3 className="text-base font-medium text-[var(--foreground)] mb-4">Quick Action For Your Meeting</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {quickActions.map((action, idx) => {
                    const handleClick = () => {
                      if (action.title === "Take Notes From Online Meeting") {
                        setIsOnlineMeetingOpen(true)
                      } else if (action.title === "Take Notes From Realtime Meeting") {
                        setIsRealtimeMeetingOpen(true)
                      } else if (action.title === "Take Notes From Upload File") {
                        router.push("/dashboard/uploads")
                      } else if (action.title === "Analytics Your Meeting") {
                        router.push("/dashboard/analytics")
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className="bg-[var(--card)] rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={handleClick}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className={`rounded-lg ${action.color} p-2`}>
                              {<action.icon className="h-5 w-5 text-[var(--primary)]" />}
                            </div>
                            <div className="flex flex-col items-start text-left gap-1.5">
                              <h3 className="font-semibold text-[var(--foreground)]">{action.title}</h3>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                          <div>
                            <IconChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Meeting History Section */}
              <div className="px-4 lg:px-6">
                <h2 className="mb-2 text-xl font-bold text-[var(--foreground)]">Meeting History</h2>
                <p className="mb-6 text-sm text-[var(--muted-foreground)]">Cari Meeting Anda Yang Telah Dibuat</p>

                {/* Search and Filter Bar (shared) */}
                <div className="mb-6">
                  <ListToolbar controls={controls as any} />
                </div>

                {/* Meeting Cards Grid */}
                {isLoadingMeetings ? (
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
                    {/* LLM / OpenRouter error banner */}
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
                    {/* Pagination controls */}
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
        <OnlineMeetingDialog
          isOpen={isOnlineMeetingOpen}
          onClose={() => setIsOnlineMeetingOpen(false)}
        />
        <RealtimeMeetingDialog
          isOpen={isRealtimeMeetingOpen}
          onClose={() => setIsRealtimeMeetingOpen(false)}
        />
    </SidebarProvider>
  )
}
