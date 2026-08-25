"use client"

import { Button } from "@/components/ui/button"
import {
  IconArrowLeft,
  IconClock,
  IconUsers,
  IconMessage,
  IconListCheck,
  IconTags,
  IconVideo,
  IconMicrophone,
  IconFileUpload,
  IconExternalLink,
  IconNotes,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface MeetingDetailAnalyticsProps {
  meetingId: string
  data: any
  isLoading?: boolean
  onBack: () => void
}

const SPEAKER_PALETTE = ["#6366f1", "#a855f7", "#f59e0b", "#10b981", "#f43f5e", "#0ea5e9"]

function formatDuration(seconds: number) {
  if (!seconds) return "0m"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20'
    case 'high':   return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
    default:       return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'done':        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    case 'in-progress': return 'bg-primary/10 text-primary border-primary/20'
    default:            return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusLabel(status: string) {
  if (status === 'done') return 'Selesai'
  if (status === 'in-progress') return 'Berlangsung'
  return 'To Do'
}

function SectionCard({ title, sub, right, children }: {
  title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {right && <div className="shrink-0 self-center">{right}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function MeetingDetailAnalytics({ meetingId, data, isLoading, onBack }: MeetingDetailAnalyticsProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat analytics meeting...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-muted-foreground">Data tidak tersedia</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">Kembali</Button>
      </div>
    )
  }

  const { meeting, speakers, topics, actionItems, totalWords: apiTotalWords, comparison } = data

  const typeInfo = (() => {
    if (meeting?.type === 'online')   return { icon: <IconVideo className="h-3.5 w-3.5" />,      label: 'Online Meeting' }
    if (meeting?.type === 'realtime') return { icon: <IconMicrophone className="h-3.5 w-3.5" />, label: 'Realtime Recording' }
    return                                   { icon: <IconFileUpload className="h-3.5 w-3.5" />, label: 'File Upload' }
  })()

  const totalWords = apiTotalWords || speakers?.reduce((s: number, sp: any) => s + (sp.words || 0), 0) || 0
  const speakerDiversity = speakers?.length > 1 ? Math.min(speakers.length / 5, 1) : 0.2
  const engagementScore = Math.round((speakerDiversity * 50) + (Math.min(totalWords / 1000, 1) * 50))

  const cmpIcon = (v: number) => {
    if (v > 0) return <IconTrendingUp className="h-3.5 w-3.5" />
    if (v < 0) return <IconTrendingDown className="h-3.5 w-3.5" />
    return <IconMinus className="h-3.5 w-3.5" />
  }

  const cmpColor = (v: number, inv = false) => {
    if (v === 0) return 'text-muted-foreground'
    if (inv) return v > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
    return v > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
  }

  return (
    <div className="space-y-6">

      {/* ── Back + Header ── */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <IconArrowLeft className="h-4 w-4" />
          Kembali ke Daftar
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {meeting?.title || 'Untitled Meeting'}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                {typeInfo.icon}{typeInfo.label}
              </span>
              <span>·</span>
              <span>{formatDate(meeting?.createdAt)}</span>
            </div>
            {meeting?.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{meeting.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm"
            onClick={() => router.push(`/dashboard/meeting/${meetingId}`)}>
            <IconNotes className="h-4 w-4 mr-1.5" />
            Lihat Meeting
          </Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: <IconClock className="h-4 w-4" />,     label: "Durasi",       value: formatDuration(meeting?.duration) },
          { icon: <IconUsers className="h-4 w-4" />,     label: "Speaker",      value: speakers?.length || 0 },
          { icon: <IconMessage className="h-4 w-4" />,   label: "Kata",         value: totalWords.toLocaleString() },
          { icon: <IconTags className="h-4 w-4" />,      label: "Topik",        value: topics?.length || 0 },
          { icon: <IconListCheck className="h-4 w-4" />, label: "Action Items", value: actionItems?.length || 0 },
        ].map((m, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <span className="opacity-50">{m.icon}</span>
              {m.label}
            </div>
            <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── Comparison ── */}
      {comparison && (
        <SectionCard title="Performa vs Rata-rata" sub="Perbandingan dengan meeting tipikal Anda">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Durasi",        v: comparison.vsAverage?.duration || 0,      sub: `avg: ${comparison.avgDuration}m`,                inv: true },
              { label: "Speaker",       v: comparison.vsAverage?.participants || 0,   sub: `avg: ${comparison.avgParticipants?.toFixed(1)}`,  inv: false },
              { label: "Action Items",  v: comparison.vsAverage?.actionItems || 0,    sub: `avg: ${comparison.avgActionItems?.toFixed(1)}`,   inv: false },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                <div className={`flex items-center justify-center gap-1 text-lg font-bold tabular-nums ${cmpColor(item.v, item.inv)}`}>
                  {cmpIcon(item.v)}{Math.abs(item.v)}%
                </div>
                <div className="text-xs font-medium text-foreground mt-1">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.sub}</div>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
              <div className="text-lg font-bold tabular-nums text-foreground">{engagementScore}</div>
              <div className="text-xs font-medium text-foreground mt-1">Engagement</div>
              <div className="text-[11px] text-muted-foreground">/ 100</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
              <div className="text-lg font-bold tabular-nums text-foreground">
                {meeting?.duration > 0 ? Math.round(totalWords / (meeting.duration / 60)) : 0}
              </div>
              <div className="text-xs font-medium text-foreground mt-1">Kata/Menit</div>
              <div className="text-[11px] text-muted-foreground">kecepatan bicara</div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Speaker Distribution + Stats ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Donut + Legend */}
        <SectionCard title="Distribusi Speaker" sub="Porsi bicara tiap peserta">
          {speakers?.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <svg className="w-28 h-28 -rotate-90">
                  {speakers.map((sp: any, i: number) => {
                    const offset = speakers.slice(0, i).reduce((s: number, x: any) => s + (x.total || 0), 0)
                    return (
                      <circle key={i} cx="56" cy="56" r="42" fill="none"
                        stroke={SPEAKER_PALETTE[i % SPEAKER_PALETTE.length]}
                        strokeWidth="13"
                        strokeDasharray={`${(sp.total || 0) * 2.64} 264`}
                        strokeDashoffset={`-${offset * 2.64}`}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{speakers.length}</span>
                  <span className="text-[10px] text-muted-foreground">speakers</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 max-h-44 overflow-y-auto">
                {speakers.map((sp: any, i: number) => {
                  const raw = sp.speaker || `Speaker ${i + 1}`
                  const name = raw.match(/^SPEAKER[_\s]*(\d+)$/i)
                    ? `Speaker ${raw.match(/\d+/)?.[0]}` : raw
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: SPEAKER_PALETTE[i % SPEAKER_PALETTE.length] }} />
                      <span className="text-sm text-foreground truncate flex-1">{name}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{sp.total || 0}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <IconUsers className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Tidak ada data speaker</p>
            </div>
          )}
        </SectionCard>

        {/* Speaker Stats Table */}
        <SectionCard title="Statistik Speaker" sub="Metrik bicara terperinci">
          {speakers?.length > 0 ? (
            <div className="divide-y divide-border">
              {speakers.map((sp: any, i: number) => {
                const raw = sp.speaker || `Speaker ${i + 1}`
                const name = raw.match(/^SPEAKER[_\s]*(\d+)$/i)
                  ? `Speaker ${raw.match(/\d+/)?.[0]}` : raw
                const color = SPEAKER_PALETTE[i % SPEAKER_PALETTE.length]
                return (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: color }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{name}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground pl-7">
                      <span><span className="font-semibold text-foreground tabular-nums">{sp.total || 0}%</span> talk time</span>
                      <span><span className="font-semibold text-foreground tabular-nums">{(sp.words || 0).toLocaleString()}</span> kata</span>
                      <span><span className="font-semibold text-foreground tabular-nums">{sp.talks || 0}</span> giliran</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xs text-muted-foreground">Tidak ada statistik speaker</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Topics ── */}
      <SectionCard
        title="Topik & Kata Kunci"
        sub="Poin diskusi utama dari meeting ini"
        right={topics?.length > 0 && <span className="text-xs text-muted-foreground">{topics.length} topik</span>}
      >
        {topics?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t: any, i: number) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-foreground border border-border hover:bg-muted/70 transition-colors">
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconTags className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Tidak ada topik diekstrak</p>
          </div>
        )}
      </SectionCard>

      {/* ── Action Items ── */}
      <SectionCard
        title="Action Items"
        sub={`${actionItems?.length || 0} item dihasilkan dari meeting ini`}
        right={actionItems?.length > 0 && (
          <div className="flex gap-1.5">
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getPriorityStyle('high')}`}>
              {actionItems.filter((i: any) => i.priority === 'urgent' || i.priority === 'high').length} High
            </span>
          </div>
        )}
      >
        {actionItems?.length > 0 ? (
          <div className="divide-y divide-border">
            {actionItems.map((item: any, i: number) => (
              <div key={i} className="py-3.5 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {item.priority && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${getPriorityStyle(item.priority)}`}>
                      {item.priority}
                    </span>
                  )}
                  {item.status && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusStyle(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  )}
                  {item.assignee && (
                    <span className="text-[11px] text-muted-foreground">👤 {item.assignee}</span>
                  )}
                  {item.dueDate && (
                    <span className="text-[11px] text-muted-foreground">
                      📅 {new Date(item.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconListCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Tidak ada action items</p>
          </div>
        )}
      </SectionCard>

      {/* ── CTA ── */}
      <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground">Lihat detail lengkap meeting ini</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transkrip, catatan, dan board kanban tersedia di halaman meeting.
          </p>
        </div>
        <Button size="sm" onClick={() => router.push(`/dashboard/meeting/${meetingId}`)}>
          Buka Meeting
          <IconExternalLink className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

    </div>
  )
}
