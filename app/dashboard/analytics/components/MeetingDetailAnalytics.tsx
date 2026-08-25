"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconNotes,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface MeetingDetailAnalyticsProps {
  meetingId: string
  data: any
  isLoading?: boolean
  onBack: () => void
}

// Distinct colors for speaker donut & list
const SPEAKER_COLORS = [
  "#6366f1", // indigo (primary-like)
  "#a855f7", // violet
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#0ea5e9", // sky
]

export function MeetingDetailAnalytics({ meetingId, data, isLoading, onBack }: MeetingDetailAnalyticsProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Memuat analytics meeting...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Data tidak tersedia</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">Kembali</Button>
      </div>
    )
  }

  const { meeting, speakers, topics, actionItems, participants, totalWords: apiTotalWords, comparison } = data

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getTypeInfo = (type: string) => {
    if (type === 'online') return { icon: <IconVideo className="h-4 w-4" />, label: 'Online Meeting' }
    if (type === 'realtime') return { icon: <IconMicrophone className="h-4 w-4" />, label: 'Realtime Recording' }
    return { icon: <IconFileUpload className="h-4 w-4" />, label: 'File Upload' }
  }

  const typeInfo = getTypeInfo(meeting?.type)
  const totalWords = apiTotalWords || speakers?.reduce((sum: number, s: any) => sum + (s.words || 0), 0) || 0
  const speakerDiversity = speakers?.length > 1 ? Math.min(speakers.length / 5, 1) : 0.2
  const engagementScore = Math.round((speakerDiversity * 50) + (Math.min(totalWords / 1000, 1) * 50))

  const getComparisonColor = (value: number, inverse: boolean = false) => {
    if (value === 0) return 'text-muted-foreground'
    if (inverse) return value > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
    return value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
  }

  const getComparisonIcon = (value: number) => {
    if (value > 0) return <IconTrendingUp className="h-4 w-4" />
    if (value < 0) return <IconTrendingDown className="h-4 w-4" />
    return <IconMinus className="h-4 w-4" />
  }

  // Priority badge styles using semantic CSS vars (dark-mode safe)
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive border border-destructive/20'
      case 'high':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
      default:
        return 'bg-muted text-muted-foreground border border-border'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
      case 'in-progress':
        return 'bg-primary/10 text-primary border border-primary/20'
      default:
        return 'bg-muted text-muted-foreground border border-border'
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'done') return 'Selesai'
    if (status === 'in-progress') return 'Berlangsung'
    return 'To Do'
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2 rounded-xl">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar
          </Button>

          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{meeting?.title || 'Untitled Meeting'}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {typeInfo.icon}
              {typeInfo.label}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-sm text-muted-foreground">{formatDate(meeting?.createdAt)}</span>
          </div>
          {meeting?.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{meeting.description}</p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => router.push(`/dashboard/meeting/${meetingId}`)}
        >
          <IconNotes className="h-4 w-4 mr-2" />
          Lihat Meeting Lengkap
        </Button>
      </div>

      {/* Key Metrics — 5 chip-stat horizontal */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: <IconClock className="h-4 w-4" />, label: "Durasi", value: formatDuration(meeting?.duration) },
          { icon: <IconUsers className="h-4 w-4" />, label: "Speaker", value: speakers?.length || 0 },
          { icon: <IconMessage className="h-4 w-4" />, label: "Kata", value: totalWords.toLocaleString() },
          { icon: <IconTags className="h-4 w-4" />, label: "Topik", value: topics?.length || 0 },
          { icon: <IconListCheck className="h-4 w-4" />, label: "Action Items", value: actionItems?.length || 0 },
        ].map((m, i) => (
          <div key={i} className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="text-primary">{m.icon}</span>
              {m.label}
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Comparison vs Average */}
      {comparison && (
        <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Performa vs Rata-rata Anda</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Perbandingan meeting ini dengan meeting tipikal Anda</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Durasi", value: comparison.vsAverage?.duration || 0, sub: `avg: ${comparison.avgDuration}m`, inverse: true },
              { label: "Speaker", value: comparison.vsAverage?.participants || 0, sub: `avg: ${comparison.avgParticipants?.toFixed(1)}`, inverse: false },
              { label: "Action Items", value: comparison.vsAverage?.actionItems || 0, sub: `avg: ${comparison.avgActionItems?.toFixed(1)}`, inverse: false },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                <div className={`flex items-center justify-center gap-1 text-xl font-extrabold ${getComparisonColor(item.value, item.inverse)}`}>
                  {getComparisonIcon(item.value)}
                  {Math.abs(item.value)}%
                </div>
                <div className="text-xs font-semibold text-foreground mt-1">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.sub}</div>
              </div>
            ))}

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center col-span-1">
              <div className="text-xl font-extrabold text-primary">{engagementScore}</div>
              <div className="text-xs font-semibold text-foreground mt-1">Engagement</div>
              <div className="text-[11px] text-muted-foreground">dari 100</div>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border text-center col-span-1">
              <div className="text-xl font-extrabold text-foreground">
                {meeting?.duration > 0 ? Math.round(totalWords / (meeting.duration / 60)) : 0}
              </div>
              <div className="text-xs font-semibold text-foreground mt-1">Kata/Menit</div>
              <div className="text-[11px] text-muted-foreground">kecepatan bicara</div>
            </div>
          </div>
        </Card>
      )}

      {/* Speaker Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Donut + list */}
        <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Distribusi Speaker</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Porsi bicara tiap speaker</p>
          </div>

          {speakers && speakers.length > 0 ? (
            <div className="flex gap-6 items-center">
              <div className="relative shrink-0">
                <svg className="w-28 h-28 -rotate-90">
                  {speakers.map((speaker: any, index: number) => {
                    const offset = speakers.slice(0, index).reduce((sum: number, s: any) => sum + (s.total || 0), 0)
                    const color = SPEAKER_COLORS[index % SPEAKER_COLORS.length]
                    return (
                      <circle
                        key={index}
                        cx="56" cy="56" r="42"
                        fill="none"
                        stroke={color}
                        strokeWidth="14"
                        strokeDasharray={`${(speaker.total || 0) * 2.64} 264`}
                        strokeDashoffset={`-${offset * 2.64}`}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-foreground">{speakers.length}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">speakers</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 max-h-44 overflow-y-auto">
                {speakers.map((speaker: any, index: number) => {
                  const speakerName = speaker.speaker || `Speaker ${index + 1}`
                  const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i)
                    ? `Speaker ${speakerName.match(/\d+/)?.[0]}`
                    : speakerName
                  const color = SPEAKER_COLORS[index % SPEAKER_COLORS.length]
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-foreground truncate flex-1">{displayName}</span>
                      <span className="text-sm font-bold text-foreground">{speaker.total || 0}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <IconUsers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Tidak ada data speaker</p>
            </div>
          )}
        </Card>

        {/* Speaker Statistics */}
        <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Statistik Speaker</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Metrik bicara terperinci</p>
          </div>

          {speakers && speakers.length > 0 ? (
            <div className="space-y-2.5">
              {speakers.map((speaker: any, index: number) => {
                const speakerName = speaker.speaker || `Speaker ${index + 1}`
                const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i)
                  ? `Speaker ${speakerName.match(/\d+/)?.[0]}`
                  : speakerName
                const color = SPEAKER_COLORS[index % SPEAKER_COLORS.length]

                return (
                  <div key={index} className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground text-sm truncate">{displayName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-extrabold text-foreground">{speaker.total || 0}%</div>
                        <div className="text-[10px] text-muted-foreground font-medium">Talk Time</div>
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-foreground">{(speaker.words || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">Kata</div>
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-foreground">{speaker.talks || 0}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">Giliran</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">Tidak ada statistik speaker</p>
            </div>
          )}
        </Card>
      </div>

      {/* Topics & Keywords */}
      <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Topik & Kata Kunci</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Poin diskusi utama dari meeting ini</p>
          </div>
          {topics && topics.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground">{topics.length} topik</span>
          )}
        </div>

        {topics && topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic: any, index: number) => (
              <div
                key={index}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {topic.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconTags className="h-7 w-7 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Tidak ada topik diekstrak</p>
            <p className="text-xs text-muted-foreground mt-1">Topik dianalisis dari transkrip meeting</p>
          </div>
        )}
      </Card>

      {/* Action Items */}
      <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Action Items</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{actionItems?.length || 0} item dihasilkan dari meeting ini</p>
          </div>
          {actionItems && actionItems.length > 0 && (
            <div className="flex gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-full font-semibold ${getPriorityStyle('high')}`}>
                {actionItems.filter((i: any) => i.priority === 'urgent' || i.priority === 'high').length} High
              </span>
              <span className={`px-2.5 py-1 rounded-full font-semibold ${getPriorityStyle('low')}`}>
                {actionItems.filter((i: any) => i.priority !== 'urgent' && i.priority !== 'high').length} Normal
              </span>
            </div>
          )}
        </div>

        {actionItems && actionItems.length > 0 ? (
          <div className="space-y-2.5">
            {actionItems.map((item: any, index: number) => (
              <div key={index} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {item.priority && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${getPriorityStyle(item.priority)}`}>
                      {item.priority}
                    </span>
                  )}
                  {item.status && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${getStatusStyle(item.status)}`}>
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
            <IconListCheck className="h-7 w-7 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Tidak ada action items</p>
            <p className="text-xs text-muted-foreground mt-1">Action items diekstrak dari konten meeting</p>
          </div>
        )}
      </Card>

      {/* Summary CTA */}
      <div className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 flex-wrap">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <IconChartPie className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm">Ringkasan Analytics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Meeting {formatDuration(meeting?.duration)} ini melibatkan {speakers?.length || 0} speaker membahas {topics?.length || 0} topik,
            menghasilkan {actionItems?.length || 0} action items dengan engagement score {engagementScore}/100.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl shrink-0"
          onClick={() => router.push(`/dashboard/meeting/${meetingId}`)}
        >
          Lihat Detail Lengkap
          <IconExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
