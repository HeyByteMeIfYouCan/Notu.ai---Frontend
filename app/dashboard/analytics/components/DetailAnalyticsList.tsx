"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  IconClock, 
  IconUsers, 
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
  IconStar
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
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
        {status}
      </span>
    )
  }

  const getTypeIcon = (type: string) => {
    if (type === 'online') return <IconVideo className="h-4 w-4 text-blue-500" />
    if (type === 'realtime') return <IconMicrophone className="h-4 w-4 text-green-500" />
    return <IconFileUpload className="h-4 w-4 text-purple-500" />
  }

  // Calculate productivity badge based on action items & duration
  const getProductivityBadge = (meeting: any) => {
    const actionsPerHour = meeting.duration > 0 
      ? (meeting.actionItemsCount / (meeting.duration / 3600))
      : 0
    
    if (actionsPerHour >= 3) return { label: 'High', color: 'bg-green-500' }
    if (actionsPerHour >= 1) return { label: 'Medium', color: 'bg-yellow-500' }
    return { label: 'Low', color: 'bg-gray-400' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <IconLoader2 className="inline-block h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Latest First</SelectItem>
            <SelectItem value="duration">Longest Duration</SelectItem>
            <SelectItem value="participants">Most Participants</SelectItem>
            <SelectItem value="actions">Most Actions</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter by Type */}
        <Select value={currentFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="online">Online Meeting</SelectItem>
            <SelectItem value="realtime">Realtime Recording</SelectItem>
            <SelectItem value="upload">Uploaded File</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      {pagination && (
        <div className="text-sm text-muted-foreground">
          Showing {meetings.length} of {pagination.totalItems} meetings
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      )}

      {/* Meeting List */}
      <div className="space-y-3">
        {meetings.map((meeting) => {
          const productivity = getProductivityBadge(meeting)
          
          return (
            <Card 
              key={meeting._id}
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group border-l-4"
              style={{ 
                borderLeftColor: meeting.status === 'completed' ? '#22c55e' : 
                  meeting.status === 'processing' ? '#eab308' : 
                  meeting.status === 'failed' ? '#ef4444' : '#6b7280'
              }}
              onClick={() => onMeetingClick(meeting._id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title Row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{meeting.title || 'Untitled Meeting'}</h3>
                    {getStatusBadge(meeting.status)}
                    {meeting.status === 'completed' && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${productivity.color}`}>
                        {productivity.label} Productivity
                      </span>
                    )}
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconCalendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(meeting.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconClock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDuration(meeting.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconMessage className="h-4 w-4 flex-shrink-0" />
                      <span>{meeting.speakersCount || 0} speakers</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconListCheck className="h-4 w-4 flex-shrink-0" />
                      <span>{meeting.actionItemsCount || 0} actions</span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {getTypeIcon(meeting.type)}
                      <span className="capitalize">{meeting.type || 'unknown'}</span>
                    </div>
                    {meeting.topicsCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <IconTags className="h-3.5 w-3.5" />
                        <span>{meeting.topicsCount} topics</span>
                      </div>
                    )}
                    {meeting.hasBoard && (
                      <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                        Has Kanban Board
                      </div>
                    )}
                  </div>
                </div>

                <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </Card>
          )
        })}

        {meetings.length === 0 && (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <IconSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No meetings found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <ModernPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
