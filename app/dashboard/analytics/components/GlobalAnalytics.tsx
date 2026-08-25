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

// Colors for meeting source bars
const SOURCE_COLORS = [
  "bg-primary",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
]

export function GlobalAnalytics({ data, isLoading }: GlobalAnalyticsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Memuat analytics...</p>
        </div>
      </div>
    )
  }

  const { meetings, meetingsByType, totalDuration, avgDuration, tasks, boards, completionRate, participants, topSpeakers, topTopics, trends } = data || {}

  const productivityScore = (() => {
    if (!meetings?.total) return 0
    const completionFactor = (meetings.completed / meetings.total) * 40
    const taskFactor = tasks?.total ? Math.min((tasks.done / tasks.total) * 30, 30) : 0
    const boardFactor = boards?.total ? Math.min(boards.total * 5, 30) : 0
    return Math.round(completionFactor + taskFactor + boardFactor)
  })()

  const avgActionsPerMeeting = meetings?.completed > 0
    ? Math.round((tasks?.total || 0) / meetings.completed * 10) / 10
    : 0

  const thisWeekMeetings = trends?.slice(-7).reduce((sum: number, t: any) => sum + t.count, 0) || 0
  const lastWeekMeetings = trends?.slice(-14, -7).reduce((sum: number, t: any) => sum + t.count, 0) || 0
  const weeklyChange = lastWeekMeetings > 0
    ? Math.round(((thisWeekMeetings - lastWeekMeetings) / lastWeekMeetings) * 100)
    : 0

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { label: "Optimal", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" }
    if (score >= 40) return { label: "Progres Baik", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" }
    return { label: "Perlu Fokus", color: "bg-destructive/10 text-destructive border border-destructive/20" }
  }

  const scoreBadge = getScoreBadge(productivityScore)

  // Avatar color palette for top speakers
  const AVATAR_COLORS = [
    "bg-primary",
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-rose-500",
  ]

  return (
    <div className="space-y-5">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title="Total Meeting"
          value={meetings?.total || 0}
          subtitle={`${meetings?.completed || 0} selesai`}
          icon={<IconCalendar className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Durasi"
          value={`${Math.floor((totalDuration || 0) / 60)}h ${(totalDuration || 0) % 60}m`}
          subtitle="Rekaman agregat"
          icon={<IconClock className="h-4 w-4" />}
        />
        <MetricCard
          title="Action Items"
          value={tasks?.total || 0}
          subtitle={`${tasks?.done || 0} selesai`}
          icon={<IconListCheck className="h-4 w-4" />}
        />
        <MetricCard
          title="Kanban Board"
          value={boards?.total || 0}
          subtitle="Ruang kerja proyek"
          icon={<IconLayoutKanban className="h-4 w-4" />}
        />
        <MetricCard
          title="Minggu Ini"
          value={thisWeekMeetings}
          subtitle="7 hari terakhir"
          icon={<IconTrendingUp className="h-4 w-4" />}
          trend={weeklyChange !== 0 ? { value: weeklyChange, label: "vs minggu lalu" } : undefined}
        />
      </div>

      {/* Productivity Score + Operational Insights */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Productivity Score */}
        <Card className="lg:col-span-5 p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Indeks Produktivitas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Efisiensi meeting & eksekusi task</p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${scoreBadge.color}`}>
                {scoreBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-5 py-1">
              <div className="relative shrink-0">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="var(--muted)" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="38"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    strokeDasharray={`${productivityScore * 2.39} 239`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold tracking-tight text-foreground">{productivityScore}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="text-foreground font-semibold">{meetings?.completed || 0}/{meetings?.total || 0}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${meetings?.total > 0 ? (meetings.completed / meetings.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-muted-foreground">Task Done</span>
                    <span className="text-foreground font-semibold">{tasks?.done || 0}/{tasks?.total || 0}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full transition-all"
                      style={{ width: `${tasks?.total > 0 ? (tasks.done / tasks.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Dari meeting, task & board</span>
            <span className="font-semibold text-foreground">{completionRate || 0}% completion</span>
          </div>
        </Card>

        {/* Operational Insights — clean 2-col table style */}
        <Card className="lg:col-span-7 p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Insight Operasional</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Metrik kinerja utama sekilas pandang</p>
            </div>
            <IconActivity className="h-4 w-4 text-primary" />
          </div>

          <div className="divide-y divide-border/60">
            {[
              { label: "Completion Rate", value: `${completionRate || 0}%`, sub: "Tingkat keberhasilan", icon: <IconPercentage className="h-4 w-4" /> },
              { label: "Rata-rata Action Items", value: avgActionsPerMeeting, sub: "Per meeting selesai", icon: <IconTargetArrow className="h-4 w-4" /> },
              { label: "Rata-rata Durasi", value: avgDuration ? `${Math.round(avgDuration)}m` : "0m", sub: "Panjang rata-rata", icon: <IconClock className="h-4 w-4" /> },
              { label: "Peserta Rata-rata", value: `${Math.round((participants?.avg || 0) * 10) / 10}`, sub: "Attendee per meeting", icon: <IconUsers className="h-4 w-4" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold tracking-tight text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts & Distribution Row */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Trends Chart */}
        <Card className="lg:col-span-8 p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Tren Aktivitas Meeting</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribusi aktivitas 14 hari terakhir</p>
            </div>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
              {(['line', 'bar', 'area'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                    chartType === type
                      ? 'bg-background shadow-sm text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <MeetingTrendsChart data={trends || []} type={chartType} />
        </Card>

        {/* Meeting Sources — with distinct colors */}
        <Card className="lg:col-span-4 p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sumber Meeting</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Distribusi berdasarkan mode</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {meetings?.total || 0} total
              </span>
            </div>

            <div className="space-y-4">
              {meetingsByType?.length > 0 ? (
                meetingsByType.map((type: any, index: number) => {
                  const barColor = SOURCE_COLORS[index % SOURCE_COLORS.length]
                  const label = type.type === 'online' ? 'Google Meet'
                    : type.type === 'realtime' ? 'Realtime'
                    : type.type === 'upload' ? 'File Upload'
                    : type.type

                  const Icon = type.type === 'online' ? IconVideo
                    : type.type === 'realtime' ? IconMicrophone
                    : IconFileUpload

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${barColor}`} />
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{type.count} sesi</span>
                          <span className="font-bold text-foreground">({type.percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${type.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Belum ada sumber meeting tercatat</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Sumber utama</span>
            <span className="font-semibold text-foreground">
              {meetingsByType?.[0]?.type === 'online' ? 'Google Meet'
                : meetingsByType?.[0]?.type === 'realtime' ? 'Realtime'
                : meetingsByType?.[0]?.type === 'upload' ? 'Upload'
                : 'Tidak ada'}
            </span>
          </div>
        </Card>
      </div>

      {/* Task Status & Top Speakers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Task Status */}
        <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Status Action Items</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Progres di semua board aktif</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {tasks?.total || 0} tasks
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5 mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${tasks?.total > 0 ? (tasks.done / tasks.total) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${tasks?.total > 0 ? ((tasks['in-progress'] || 0) / tasks.total) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-muted-foreground/30 rounded-full transition-all"
              style={{ width: `${tasks?.total > 0 ? (tasks.todo / tasks.total) * 100 : 0}%` }}
            />
          </div>

          <div className="divide-y divide-border/60">
            {[
              { label: "To Do", count: tasks?.todo || 0, total: tasks?.total, dotClass: "bg-muted-foreground/50" },
              { label: "In Progress", count: tasks?.['in-progress'] || 0, total: tasks?.total, dotClass: "bg-amber-500" },
              { label: "Done", count: tasks?.done || 0, total: tasks?.total, dotClass: "bg-primary" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${row.dotClass}`} />
                  <span className="text-sm font-medium text-foreground">{row.label}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-foreground">{row.count}</span>
                  <span className="text-muted-foreground text-xs w-10 text-right">
                    {row.total > 0 ? Math.round((row.count / row.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Speakers */}
        <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Top Speakers</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Peserta paling aktif lintas sesi</p>
            </div>
            <IconUsers className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-2">
            {topSpeakers && topSpeakers.length > 0 ? (
              topSpeakers.slice(0, 5).map((speaker: any, index: number) => {
                const speakerName = speaker.name || speaker._id || `Speaker ${index + 1}`
                const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i)
                  ? `Speaker ${speakerName.match(/\d+/)?.[0]}`
                  : speakerName
                const initial = displayName.charAt(0).toUpperCase()
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

                return (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold text-muted-foreground w-4 text-center shrink-0">
                        #{index + 1}
                      </span>
                      <div className={`flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full ${avatarColor} shrink-0`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs truncate">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground">{speaker.meetingCount || 0} meeting</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="text-sm font-bold text-foreground">{(speaker.totalWords || 0).toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">kata</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <IconMessage className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Belum ada data speaker</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Trending Topics */}
      <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Topik Diskusi Trending</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Kata kunci yang diekstrak AI dari transkrip meeting</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {topTopics?.length || 0} keyword
          </span>
        </div>

        {topTopics && topTopics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topTopics.slice(0, 24).map((topic: any, index: number) => {
              const isTop = index < 5
              return (
                <div
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                    isTop
                      ? 'bg-primary/15 text-primary border border-primary/25 font-semibold'
                      : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  <span>{topic.keyword}</span>
                  <span className="text-[10px] px-1 rounded bg-background/60 text-muted-foreground font-semibold">
                    {topic.frequency}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconChartPie className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs font-semibold text-foreground">Belum ada topik diekstrak</p>
            <p className="text-[11px] text-muted-foreground mt-1">Keyword diidentifikasi otomatis saat transkripsi meeting</p>
          </div>
        )}
      </Card>
    </div>
  )
}
