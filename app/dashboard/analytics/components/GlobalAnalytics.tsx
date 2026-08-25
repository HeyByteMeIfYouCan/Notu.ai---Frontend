"use client"

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
} from "@tabler/icons-react"
import { useState } from "react"

interface GlobalAnalyticsProps {
  data: any
  isLoading?: boolean
}

const TYPE_META: Record<string, { label: string; Icon: any; color: string }> = {
  online:   { label: "Google Meet",   Icon: IconVideo,       color: "bg-blue-500" },
  realtime: { label: "Realtime",      Icon: IconMicrophone,  color: "bg-violet-500" },
  upload:   { label: "File Upload",   Icon: IconFileUpload,  color: "bg-amber-500" },
}

const SPEAKER_PALETTE = ["#6366f1", "#a855f7", "#f59e0b", "#10b981", "#f43f5e", "#0ea5e9"]

function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export function GlobalAnalytics({ data, isLoading }: GlobalAnalyticsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat analytics...</p>
        </div>
      </div>
    )
  }

  const {
    meetings, meetingsByType, totalDuration, avgDuration,
    tasks, boards, completionRate, participants,
    topSpeakers, topTopics, trends
  } = data || {}

  const productivityScore = (() => {
    if (!meetings?.total) return 0
    const c = (meetings.completed / meetings.total) * 40
    const t = tasks?.total ? Math.min((tasks.done / tasks.total) * 30, 30) : 0
    const b = boards?.total ? Math.min(boards.total * 5, 30) : 0
    return Math.round(c + t + b)
  })()

  const avgActionsPerMeeting = meetings?.completed > 0
    ? Math.round((tasks?.total || 0) / meetings.completed * 10) / 10 : 0

  const thisWeek = trends?.slice(-7).reduce((s: number, t: any) => s + t.count, 0) || 0
  const lastWeek = trends?.slice(-14, -7).reduce((s: number, t: any) => s + t.count, 0) || 0
  const weekChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0

  const scoreLabel = productivityScore >= 70 ? "Optimal" : productivityScore >= 40 ? "Progres Baik" : "Perlu Fokus"

  return (
    <div className="space-y-6">

      {/* ── 1. KPI Strip ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard title="Total Meeting"  value={meetings?.total || 0}
          subtitle={`${meetings?.completed || 0} selesai`} icon={<IconCalendar className="h-4 w-4" />} />
        <MetricCard title="Total Durasi"
          value={`${Math.floor((totalDuration || 0) / 60)}h ${(totalDuration || 0) % 60}m`}
          subtitle="Rekaman agregat" icon={<IconClock className="h-4 w-4" />} />
        <MetricCard title="Action Items"   value={tasks?.total || 0}
          subtitle={`${tasks?.done || 0} selesai`} icon={<IconListCheck className="h-4 w-4" />} />
        <MetricCard title="Kanban Board"   value={boards?.total || 0}
          subtitle="Ruang kerja" icon={<IconLayoutKanban className="h-4 w-4" />} />
        <MetricCard title="Minggu Ini"     value={thisWeek}
          subtitle="7 hari terakhir" icon={<IconTrendingUp className="h-4 w-4" />}
          trend={weekChange !== 0 ? { value: weekChange, label: "" } : undefined} />
      </div>

      {/* ── 2. Productivity + Operational ── */}
      <div className="grid gap-4 lg:grid-cols-12">

        {/* Productivity Score */}
        <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-5 flex flex-col gap-5">
          <SectionHeader
            title="Indeks Produktivitas"
            sub="Efisiensi meeting & eksekusi task"
            right={
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                productivityScore >= 70
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : productivityScore >= 40
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}>{scoreLabel}</span>
            }
          />

          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0">
              <svg className="w-24 h-24 -rotate-90">
                <circle cx="48" cy="48" r="36" fill="none" stroke="var(--muted)" strokeWidth="7" />
                <circle cx="48" cy="48" r="36" fill="none" stroke="var(--primary)" strokeWidth="7"
                  strokeDasharray={`${productivityScore * 2.26} 226`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold tabular-nums text-foreground">{productivityScore}</span>
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>

            {/* Progress bars */}
            <div className="flex-1 space-y-3">
              {[
                { label: "Meeting selesai", done: meetings?.completed || 0, total: meetings?.total || 0 },
                { label: "Task selesai",    done: tasks?.done || 0,         total: tasks?.total || 0 },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground tabular-nums">{row.done}/{row.total}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${row.total > 0 ? (row.done / row.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Dari meeting, task & board</span>
            <span className="font-medium text-foreground tabular-nums">{completionRate || 0}% completion</span>
          </div>
        </div>

        {/* Operational Insights — clean list */}
        <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-5">
          <SectionHeader title="Insight Operasional" sub="Metrik kinerja utama" />
          <div className="divide-y divide-border">
            {[
              { label: "Completion Rate",        value: `${completionRate || 0}%`,                        sub: "Tingkat keberhasilan meeting" },
              { label: "Rata-rata Action Items",  value: `${avgActionsPerMeeting}`,                       sub: "Per meeting selesai" },
              { label: "Rata-rata Durasi",        value: avgDuration ? `${Math.round(avgDuration)}m` : "0m", sub: "Panjang rata-rata" },
              { label: "Peserta Rata-rata",       value: `${Math.round((participants?.avg || 0) * 10) / 10}`, sub: "Attendee per meeting" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.sub}</p>
                </div>
                <span className="text-lg font-bold tabular-nums text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Chart + Sources ── */}
      <div className="grid gap-4 lg:grid-cols-12">

        {/* Trends Chart */}
        <div className="lg:col-span-8 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tren Aktivitas Meeting</h3>
              <p className="text-xs text-muted-foreground mt-0.5">14 hari terakhir</p>
            </div>
            <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted">
              {(["area", "bar", "line"] as const).map((t) => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                    chartType === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <MeetingTrendsChart data={trends || []} type={chartType} />
        </div>

        {/* Meeting Sources */}
        <div className="lg:col-span-4 rounded-2xl bg-card border border-border p-5 flex flex-col">
          <SectionHeader
            title="Sumber Meeting"
            sub="Distribusi per mode"
            right={<span className="text-xs text-muted-foreground tabular-nums">{meetings?.total || 0} total</span>}
          />

          <div className="space-y-4 flex-1">
            {meetingsByType?.length > 0 ? (
              meetingsByType.map((item: any, i: number) => {
                const meta = TYPE_META[item.type] || { label: item.type, Icon: IconVideo, color: "bg-muted" }
                const { Icon } = meta
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${meta.color}`} />
                        <span className="font-medium text-foreground">{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>{item.count}</span>
                        <span className="font-semibold text-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${meta.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Belum ada data sumber</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Task Status + Top Speakers ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Task Status */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <SectionHeader
            title="Status Action Items"
            sub="Progres di semua board aktif"
            right={<span className="text-xs text-muted-foreground tabular-nums">{tasks?.total || 0} tasks</span>}
          />

          {/* Segmented Bar */}
          <div className="h-2 w-full rounded-full overflow-hidden flex mb-5 bg-muted">
            <div className="h-full bg-emerald-500 transition-all"
              style={{ width: `${tasks?.total > 0 ? (tasks.done / tasks.total) * 100 : 0}%` }} />
            <div className="h-full bg-amber-500 transition-all"
              style={{ width: `${tasks?.total > 0 ? ((tasks['in-progress'] || 0) / tasks.total) * 100 : 0}%` }} />
          </div>

          <div className="divide-y divide-border">
            {[
              { label: "To Do",        count: tasks?.todo || 0,              dot: "bg-muted-foreground/30" },
              { label: "In Progress",  count: tasks?.['in-progress'] || 0,   dot: "bg-amber-500" },
              { label: "Done",         count: tasks?.done || 0,              dot: "bg-emerald-500" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${row.dot}`} />
                  <span className="text-sm text-foreground">{row.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{row.count}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                    {tasks?.total > 0 ? Math.round((row.count / tasks.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Speakers */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <SectionHeader title="Top Speakers" sub="Peserta paling aktif lintas sesi" />

          <div className="space-y-1">
            {topSpeakers?.length > 0 ? (
              topSpeakers.slice(0, 5).map((sp: any, i: number) => {
                const raw = sp.name || sp._id || `Speaker ${i + 1}`
                const name = raw.match(/^SPEAKER[_\s]*(\d+)$/i)
                  ? `Speaker ${raw.match(/\d+/)?.[0]}` : raw
                const initial = name.charAt(0).toUpperCase()
                const color = SPEAKER_PALETTE[i % SPEAKER_PALETTE.length]

                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground w-4 text-center shrink-0">#{i + 1}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
                      style={{ backgroundColor: color }}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{sp.meetingCount || 0} meeting</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-foreground">{(sp.totalWords || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">kata</p>
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
        </div>
      </div>

      {/* ── 5. Trending Topics ── */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <SectionHeader
          title="Topik Diskusi Trending"
          sub="Kata kunci yang diekstrak AI dari transkrip meeting"
          right={<span className="text-xs text-muted-foreground">{topTopics?.length || 0} keyword</span>}
        />

        {topTopics?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topTopics.slice(0, 24).map((topic: any, i: number) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                i < 5
                  ? "bg-foreground text-background font-medium"
                  : "bg-muted text-muted-foreground hover:text-foreground border border-border"
              }`}>
                {topic.keyword}
                <span className={`text-[10px] font-semibold ${i < 5 ? "opacity-60" : "text-muted-foreground/70"}`}>
                  {topic.frequency}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconChartPie className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Belum ada topik diekstrak</p>
          </div>
        )}
      </div>

    </div>
  )
}
