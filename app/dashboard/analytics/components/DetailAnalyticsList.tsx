"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
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

export function DetailAnalyticsList({
  meetings,
  pagination,
  isLoading,
  onMeetingClick,
  onPageChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
  currentSort,
  currentFilter,
  searchQuery
}: DetailAnalyticsListProps) {

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      processing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      failed: 'bg-destructive/10 text-destructive border border-destructive/20',
      pending: 'bg-muted text-muted-foreground border border-border',
    }
    const labels: Record<string, string> = {
      completed: 'Selesai',
      processing: 'Diproses',
      failed: 'Gagal',
      pending: 'Menunggu',
    }
    return (
      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getTypeIcon = (type: string) => {
    if (type === 'online') return <IconVideo className="h-4 w-4 text-primary" />
    if (type === 'realtime') return <IconMicrophone className="h-4 w-4 text-primary" />
    return <IconFileUpload className="h-4 w-4 text-primary" />
  }

  const getTypeLabel = (type: string) => {
    if (type === 'online') return 'Google Meet'
    if (type === 'realtime') return 'Realtime'
    return 'Upload'
  }

  const getProductivityBadge = (meeting: any) => {
    const actionsPerHour = meeting.duration > 0
      ? (meeting.actionItemsCount / (meeting.duration / 3600))
      : 0

    if (actionsPerHour >= 3) return { label: 'Produktif', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' }
    if (actionsPerHour >= 1) return { label: 'Sedang', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' }
    return { label: 'Rendah', color: 'bg-muted text-muted-foreground border border-border' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <IconLoader2 className="inline-block h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Memuat meeting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters — consistent with ListToolbar pattern */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card p-1.5 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari meeting..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-4 bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="h-5 w-px bg-border/50 hidden md:block" />

        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-[170px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Terbaru</SelectItem>
            <SelectItem value="duration">Durasi Terlama</SelectItem>
            <SelectItem value="participants">Speaker Terbanyak</SelectItem>
            <SelectItem value="actions">Action Item Terbanyak</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-5 w-px bg-border/50 hidden md:block" />

        <Select value={currentFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="h-9 w-[170px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
            <SelectValue placeholder="Filter tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="online">Online Meeting</SelectItem>
            <SelectItem value="realtime">Realtime Recording</SelectItem>
            <SelectItem value="upload">File Upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results summary */}
      {pagination && (
        <p className="text-xs text-muted-foreground px-0.5">
          Menampilkan <span className="font-semibold text-foreground">{meetings.length}</span> dari <span className="font-semibold text-foreground">{pagination.totalItems}</span> meeting
          {searchQuery && <> untuk "<span className="font-semibold text-foreground">{searchQuery}</span>"</>}
        </p>
      )}

      {/* Meeting List */}
      <div className="space-y-2.5">
        {meetings.map((meeting) => {
          const productivity = getProductivityBadge(meeting)

          return (
            <div
              key={meeting._id}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => onMeetingClick(meeting._id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title Row */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getTypeIcon(meeting.type)}
                      <span className="text-[11px] font-medium text-muted-foreground">{getTypeLabel(meeting.type)}</span>
                    </div>
                    <div className="w-px h-3 bg-border/60 shrink-0 hidden sm:block" />
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                      {meeting.title || 'Untitled Meeting'}
                    </h3>
                    {getStatusBadge(meeting.status)}
                    {meeting.status === 'completed' && (
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${productivity.color}`}>
                        {productivity.label}
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(meeting.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconClock className="h-3.5 w-3.5 shrink-0" />
                      {formatDuration(meeting.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconMessage className="h-3.5 w-3.5 shrink-0" />
                      {meeting.speakersCount || 0} speaker
                    </span>
                    <span className="flex items-center gap-1">
                      <IconListCheck className="h-3.5 w-3.5 shrink-0" />
                      {meeting.actionItemsCount || 0} action items
                    </span>
                    {meeting.topicsCount > 0 && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <IconTags className="h-3.5 w-3.5 shrink-0" />
                        {meeting.topicsCount} topik
                      </span>
                    )}
                    {meeting.hasBoard && (
                      <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold border border-primary/20">
                        Kanban Aktif
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0 group-hover:translate-x-0.5">
                  <IconChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          )
        })}

        {meetings.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <IconSearch className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Tidak ada meeting ditemukan</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Coba ubah filter pencarian"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-3">
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
