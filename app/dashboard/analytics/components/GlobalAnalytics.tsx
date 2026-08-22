"use client"

import { Card } from "@/components/ui/card"
import { MetricCard } from "./MetricCard"
import { MeetingTrendsChart } from "./MeetingTrendsChart"
import {
  IconCalendar,
  IconClock,
  IconListCheck,
  IconLayoutKanban,
  IconUsers,
  IconTrendingUp,
  IconMessage,
  IconChartPie,
  IconTargetArrow,
  IconPercentage,
  IconVideo,
  IconMicrophone,
  IconFileUpload,
  IconActivity
} from "@tabler/icons-react"
import { useState } from "react"

interface GlobalAnalyticsProps {
  data: any
  isLoading?: boolean
}

export function GlobalAnalytics({ data, isLoading }: GlobalAnalyticsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const { meetings, meetingsByType, totalDuration, avgDuration, tasks, boards, completionRate, participants, topSpeakers, topTopics, trends } = data || {}

  // Calculate productivity score (0-100)
  const productivityScore = (() => {
    if (!meetings?.total) return 0
    const completionFactor = (meetings.completed / meetings.total) * 40 // max 40 points
    const taskFactor = tasks?.total ? Math.min((tasks.done / tasks.total) * 30, 30) : 0 // max 30 points
    const boardFactor = boards?.total ? Math.min(boards.total * 5, 30) : 0 // max 30 points
    return Math.round(completionFactor + taskFactor + boardFactor)
  })()

  // Calculate average action items per meeting
  const avgActionsPerMeeting = meetings?.completed > 0
    ? Math.round((tasks?.total || 0) / meetings.completed * 10) / 10
    : 0

  // Calculate weekly comparison (simple: compare this week's meetings count)
  const thisWeekMeetings = trends?.slice(-7).reduce((sum: number, t: any) => sum + t.count, 0) || 0
  const lastWeekMeetings = trends?.slice(-14, -7).reduce((sum: number, t: any) => sum + t.count, 0) || 0
  const weeklyChange = lastWeekMeetings > 0
    ? Math.round(((thisWeekMeetings - lastWeekMeetings) / lastWeekMeetings) * 100)
    : 0

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { label: "Optimal Flow", color: "bg-primary/10 text-primary border-primary/20" }
    if (score >= 40) return { label: "Good Progress", color: "bg-secondary text-secondary-foreground border-border" }
    return { label: "Needs Focus", color: "bg-destructive/10 text-destructive border-destructive/20" }
  }

  const scoreBadge = getScoreBadge(productivityScore)

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Key Metrics Grid - 5 compact cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title="Total Meetings"
          value={meetings?.total || 0}
          subtitle={`${meetings?.completed || 0} finished`}
          icon={<IconCalendar className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Duration"
          value={`${Math.floor((totalDuration || 0) / 60)}h ${(totalDuration || 0) % 60}m`}
          subtitle="Aggregate recording"
          icon={<IconClock className="h-4 w-4" />}
        />
        <MetricCard
          title="Action Items"
          value={tasks?.total || 0}
          subtitle={`${tasks?.done || 0} completed`}
          icon={<IconListCheck className="h-4 w-4" />}
        />
        <MetricCard
          title="Kanban Boards"
          value={boards?.total || 0}
          subtitle="Project workspaces"
          icon={<IconLayoutKanban className="h-4 w-4" />}
        />
        <MetricCard
          title="This Week"
          value={thisWeekMeetings}
          subtitle="Recent 7 days"
          icon={<IconTrendingUp className="h-4 w-4" />}
          trend={weeklyChange !== 0 ? { value: weeklyChange, label: "vs last week" } : undefined}
        />
      </div>

      {/* Productivity Score + Quick Stats Row */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
        {/* Productivity Score - Compact & Structured */}
        <Card className="lg:col-span-5 p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Productivity Index</h3>
                <p className="text-[11px] text-muted-foreground">Meeting efficiency & task execution</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${scoreBadge.color}`}>
                {scoreBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="relative shrink-0">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="7"
                    strokeDasharray={`${productivityScore * 2.01} 201`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold tracking-tight text-foreground">{productivityScore}</span>
                  <span className="text-[9px] font-medium text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-medium mb-1">
                    <span className="text-muted-foreground">Meeting Completion</span>
                    <span className="text-foreground">{meetings?.completed || 0}/{meetings?.total || 0}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${meetings?.total > 0 ? (meetings.completed / meetings.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium mb-1">
                    <span className="text-muted-foreground">Task Resolution</span>
                    <span className="text-foreground">{tasks?.done || 0}/{tasks?.total || 0}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${tasks?.total > 0 ? (tasks.done / tasks.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Calculated from meetings, tasks & boards</span>
            <span className="font-medium text-foreground">{completionRate || 0}% completion</span>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <Card className="lg:col-span-7 p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Operational Insights</h3>
              <p className="text-[11px] text-muted-foreground">Key performance metrics at a glance</p>
            </div>
            <IconActivity className="h-4 w-4 text-primary" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-primary">Completion</span>
                <IconPercentage className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-foreground">{completionRate || 0}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Success rate</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-primary">Avg Actions</span>
                <IconTargetArrow className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-foreground">{avgActionsPerMeeting}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Per meeting</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-primary">Avg Duration</span>
                <IconClock className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {avgDuration ? `${Math.round(avgDuration)}m` : "0m"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Average length</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-primary">Participants</span>
                <IconUsers className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {Math.round((participants?.avg || 0) * 10) / 10}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Avg attendees</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts & Distribution Row */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
        {/* Meeting Trends Chart */}
        <Card className="lg:col-span-8 p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Meeting Activity Trends</h3>
              <p className="text-[11px] text-muted-foreground">Activity distribution over the past 14 days</p>
            </div>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setChartType('line')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  chartType === 'line' 
                    ? 'bg-background shadow-xs text-foreground font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Line Chart"
              >
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  chartType === 'bar' 
                    ? 'bg-background shadow-xs text-foreground font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Bar Chart"
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  chartType === 'area' 
                    ? 'bg-background shadow-xs text-foreground font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Area Chart"
              >
                Area
              </button>
            </div>
          </div>

          <MeetingTrendsChart data={trends || []} type={chartType} />
        </Card>

        {/* Meeting Types Distribution */}
        <Card className="lg:col-span-4 p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Meeting Sources</h3>
                <p className="text-[11px] text-muted-foreground">Distribution by capture mode</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {meetings?.total || 0} Total
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {meetingsByType?.length > 0 ? (
                meetingsByType.map((type: any, index: number) => {
                  const isOnline = type.type === 'online'
                  const isRealtime = type.type === 'realtime'
                  const isUpload = type.type === 'upload'

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-primary/10 text-primary">
                            {isOnline && <IconVideo className="h-3.5 w-3.5" />}
                            {isRealtime && <IconMicrophone className="h-3.5 w-3.5" />}
                            {isUpload && <IconFileUpload className="h-3.5 w-3.5" />}
                          </div>
                          <span className="font-medium text-foreground capitalize">
                            {type.type === 'online' ? 'Google Meet' : type.type === 'realtime' ? 'Live Recording' : type.type === 'upload' ? 'File Upload' : type.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-muted-foreground">{type.count} sessions</span>
                          <span className="font-semibold text-foreground">({type.percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${type.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No meeting source recorded</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Primary capture</span>
            <span className="font-medium text-foreground">
              {meetingsByType?.[0]?.type ? `${meetingsByType[0].type.toUpperCase()}` : 'None'}
            </span>
          </div>
        </Card>
      </div>

      {/* Task Status & Top Speakers Row */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {/* Task Status Progress */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Action Items Status</h3>
              <p className="text-[11px] text-muted-foreground">Status breakdown across active boards</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {tasks?.total || 0} Total Tasks
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="space-y-3 mt-2">
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex gap-0.5 p-0.5">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${tasks?.total > 0 ? (tasks.done / tasks.total) * 100 : 0}%` }}
                title={`Done: ${tasks?.done || 0}`}
              />
              <div 
                className="h-full bg-primary/40 rounded-full transition-all"
                style={{ width: `${tasks?.total > 0 ? ((tasks['in-progress'] || 0) / tasks.total) * 100 : 0}%` }}
                title={`In Progress: ${tasks?.['in-progress'] || 0}`}
              />
              <div 
                className="h-full bg-muted-foreground/30 rounded-full transition-all"
                style={{ width: `${tasks?.total > 0 ? (tasks.todo / tasks.total) * 100 : 0}%` }}
                title={`To Do: ${tasks?.todo || 0}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  <span>To Do</span>
                </div>
                <p className="text-lg font-bold text-foreground">{tasks?.todo || 0}</p>
                <p className="text-[10px] text-muted-foreground">
                  {tasks?.total > 0 ? Math.round((tasks.todo / tasks.total) * 100) : 0}%
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-primary mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                  <span>In Progress</span>
                </div>
                <p className="text-lg font-bold text-foreground">{tasks?.['in-progress'] || 0}</p>
                <p className="text-[10px] text-muted-foreground">
                  {tasks?.total > 0 ? Math.round(((tasks['in-progress'] || 0) / tasks.total) * 100) : 0}%
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-primary mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Done</span>
                </div>
                <p className="text-lg font-bold text-foreground">{tasks?.done || 0}</p>
                <p className="text-[10px] text-muted-foreground">
                  {tasks?.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Speakers */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Top Speakers</h3>
              <p className="text-[11px] text-muted-foreground">Most active participants across sessions</p>
            </div>
            <IconUsers className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-2 mt-1">
            {topSpeakers && topSpeakers.length > 0 ? (
              topSpeakers.slice(0, 4).map((speaker: any, index: number) => {
                const speakerName = speaker.name || speaker._id || `Speaker ${index + 1}`
                const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i) 
                  ? `Speaker ${speakerName.match(/\d+/)?.[0]}` 
                  : speakerName
                const initial = displayName.charAt(0).toUpperCase()
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold text-muted-foreground w-4 text-center">
                        #{index + 1}
                      </span>
                      <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-primary-foreground rounded-full bg-primary ring-1 ring-primary/20 shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{speaker.meetingCount || 0} meetings attended</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="text-xs font-bold text-foreground">{(speaker.totalWords || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">words spoken</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6">
                <IconMessage className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No speaker data recorded yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Trending Topics */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Trending Discussion Topics</h3>
            <p className="text-[11px] text-muted-foreground">AI-extracted keywords and subjects from transcriptions</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {topTopics?.length || 0} keywords found
          </span>
        </div>

        {topTopics && topTopics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {topTopics.slice(0, 24).map((topic: any, index: number) => {
              const isTop = index < 5
              return (
                <div
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isTop 
                      ? 'bg-primary/15 text-primary border border-primary/25 font-semibold' 
                      : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  <span>{topic.keyword}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-background text-muted-foreground">
                    {topic.frequency}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <IconChartPie className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">No keyword topics extracted yet</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Keywords are automatically identified during meeting transcriptions</p>
          </div>
        )}
      </Card>
    </div>
  )
}
