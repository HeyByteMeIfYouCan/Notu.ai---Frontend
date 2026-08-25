"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  IconClock,
  IconListCheck,
  IconChevronRight,
  IconLoader2,
  IconCalendar,
  IconVideo,
  IconMicrophone,
  IconFileUpload,
  IconSearch,
  IconMessage,
  IconTags,
} from "@tabler/icons-react"
import { ModernPagination } from "@/components/custom/ModernPagination"

interface DetailAnalyticsListProps {
  meetings: any[]
  pagination: any
  isLoading?: boolean
  onMeetingClick: (meetingId: string) => void
  onPageChange: (page: number) => void
  onSortChange: (sortBy: string) => void
  onFilterChange: (filter: string) => void
  onSearchChange: (search: string) => void
  currentSort: string
  currentFilter: string
  searchQuery: string
}

function formatDuration(seconds: number) {
  if (!seconds) return "0m"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Selesai",   cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    processing: { label: "Diproses", cls: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20" },
    failed:    { label: "Gagal",     cls: "bg-destructive/10 text-destructive border-destructive/20" },
    pending:   { label: "Menunggu",  cls: "bg-muted text-muted-foreground border-border" },
  }
  const { label, cls } = map[status] || map.pending
  return (
    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'online')   return <IconVideo       className="h-3.5 w-3.5 text-muted-foreground" />
  if (type === 'realtime') return <IconMicrophone  className="h-3.5 w-3.5 text-muted-foreground" />
  return                          <IconFileUpload  className="h-3.5 w-3.5 text-muted-foreground" />
}

function TypeLabel({ type }: { type: string }) {
  if (type === 'online')   return "Google Meet"
  if (type === 'realtime') return "Realtime"
  return "Upload"
}

function ProductivityBadge({ meeting }: { meeting: any }) {
  if (meeting.status !== 'completed') return null
  const aph = meeting.duration > 0 ? meeting.actionItemsCount / (meeting.duration / 3600) : 0
  if (aph >= 3) return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Produktif</span>
  if (aph >= 1) return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Sedang</span>
  return null
}

export function DetailAnalyticsList({
  meetings, pagination, isLoading,
  onMeetingClick, onPageChange, onSortChange, onFilterChange, onSearchChange,
  currentSort, currentFilter, searchQuery
}: DetailAnalyticsListProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat meeting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Filter Toolbar — same pattern as ListToolbar */}
      <div className="flex flex-wrap items-center gap-0 rounded-xl border border-border bg-card overflow-hidden divide-x divide-border">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari meeting..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 pr-4 bg-transparent border-none shadow-none rounded-none focus-visible:ring-0 text-sm"
          />
        </div>

        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="h-10 w-[160px] bg-transparent border-none shadow-none rounded-none focus:ring-0 text-sm text-muted-foreground">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Terbaru</SelectItem>
            <SelectItem value="duration">Durasi Terlama</SelectItem>
            <SelectItem value="participants">Speaker Terbanyak</SelectItem>
            <SelectItem value="actions">Action Item Terbanyak</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="h-10 w-[150px] bg-transparent border-none shadow-none rounded-none focus:ring-0 text-sm text-muted-foreground">
            <SelectValue placeholder="Semua tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="online">Google Meet</SelectItem>
            <SelectItem value="realtime">Realtime</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {pagination && (
        <p className="text-xs text-muted-foreground">
          {meetings.length} dari {pagination.totalItems} meeting
          {searchQuery && <> · "<span className="text-foreground">{searchQuery}</span>"</>}
        </p>
      )}

      {/* Meeting List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {meetings.length > 0 ? meetings.map((meeting) => (
          <button
            key={meeting._id}
            className="w-full text-left px-4 py-3.5 hover:bg-muted/50 transition-colors group flex items-center gap-4"
            onClick={() => onMeetingClick(meeting._id)}
          >
            {/* Left: icon */}
            <div className="shrink-0 text-muted-foreground">
              <TypeIcon type={meeting.type} />
            </div>

            {/* Middle: content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {meeting.title || 'Untitled Meeting'}
                </span>
                <StatusBadge status={meeting.status} />
                <ProductivityBadge meeting={meeting} />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconCalendar className="h-3 w-3 shrink-0" />
                  {formatDate(meeting.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <IconClock className="h-3 w-3 shrink-0" />
                  {formatDuration(meeting.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <IconMessage className="h-3 w-3 shrink-0" />
                  {meeting.speakersCount || 0} speaker
                </span>
                <span className="flex items-center gap-1">
                  <IconListCheck className="h-3 w-3 shrink-0" />
                  {meeting.actionItemsCount || 0} action
                </span>
                {meeting.topicsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <IconTags className="h-3 w-3 shrink-0" />
                    {meeting.topicsCount} topik
                  </span>
                )}
                {meeting.hasBoard && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    Kanban
                  </span>
                )}
              </div>
            </div>

            {/* Right: chevron */}
            <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
              <IconChevronRight className="h-4 w-4" />
            </div>
          </button>
        )) : (
          <div className="text-center py-16">
            <IconSearch className="h-7 w-7 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Tidak ada meeting ditemukan</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Coba ubah filter pencarian"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <ModernPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems || 0}
            itemsPerPage={pagination.limit || 10}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
