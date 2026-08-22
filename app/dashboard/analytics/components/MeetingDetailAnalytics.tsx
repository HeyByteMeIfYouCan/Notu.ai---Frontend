"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconNotes
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface MeetingDetailAnalyticsProps {
  meetingId: string
  data: any
  isLoading?: boolean
  onBack: () => void
}

export function MeetingDetailAnalytics({ meetingId, data, isLoading, onBack }: MeetingDetailAnalyticsProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading meeting analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No data available</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">Go Back</Button>
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
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getTypeInfo = (type: string) => {
    if (type === 'online') return { icon: <IconVideo className="h-4 w-4" />, label: 'Online Meeting', color: 'text-blue-500' }
    if (type === 'realtime') return { icon: <IconMicrophone className="h-4 w-4" />, label: 'Realtime Recording', color: 'text-green-500' }
    return { icon: <IconFileUpload className="h-4 w-4" />, label: 'Uploaded File', color: 'text-purple-500' }
  }

  const typeInfo = getTypeInfo(meeting?.type)

  // Use totalWords from API, fallback to calculating from speakers
  const totalWords = apiTotalWords || speakers?.reduce((sum: number, s: any) => sum + (s.words || 0), 0) || 0

  // Calculate engagement score (based on speakers diversity and word count)
  const speakerDiversity = speakers?.length > 1 ? Math.min(speakers.length / 5, 1) : 0.2
  const engagementScore = Math.round((speakerDiversity * 50) + (Math.min(totalWords / 1000, 1) * 50))

  // Color helper for comparison
  const getComparisonColor = (value: number, inverse: boolean = false) => {
    if (value === 0) return 'text-muted-foreground'
    if (inverse) return value > 0 ? 'text-red-500' : 'text-green-500'
    return value > 0 ? 'text-green-500' : 'text-red-500'
  }

  const getComparisonIcon = (value: number) => {
    if (value > 0) return <IconTrendingUp className="h-4 w-4" />
    if (value < 0) return <IconTrendingDown className="h-4 w-4" />
    return <IconMinus className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>

          <h2 className="text-2xl font-bold text-foreground">{meeting?.title || 'Untitled Meeting'}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-sm ${typeInfo.color}`}>
              {typeInfo.icon}
              {typeInfo.label}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{formatDate(meeting?.createdAt)}</span>
          </div>
          {meeting?.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{meeting.description}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/meeting/${meetingId}`)}
          >
            <IconNotes className="h-4 w-4 mr-2" />
            View Full Meeting
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IconClock className="h-4 w-4" />
              <span className="text-xs font-medium">Duration</span>
            </div>
            <div className="text-xl font-bold text-foreground">{formatDuration(meeting?.duration)}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IconUsers className="h-4 w-4" />
              <span className="text-xs font-medium">Speakers</span>
            </div>
            <div className="text-xl font-bold text-foreground">{speakers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IconMessage className="h-4 w-4" />
              <span className="text-xs font-medium">Words</span>
            </div>
            <div className="text-xl font-bold text-foreground">{totalWords.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IconTags className="h-4 w-4" />
              <span className="text-xs font-medium">Topics</span>
            </div>
            <div className="text-xl font-bold text-foreground">{topics?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IconListCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Actions</span>
            </div>
            <div className="text-xl font-bold text-foreground">{actionItems?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison with Average */}
      {comparison && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance vs Your Average</CardTitle>
            <CardDescription>How this meeting compares to your typical meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={`flex items-center justify-center gap-1 text-lg font-bold ${getComparisonColor(comparison.vsAverage?.duration || 0, true)}`}>
                  {getComparisonIcon(comparison.vsAverage?.duration || 0)}
                  {Math.abs(comparison.vsAverage?.duration || 0)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Duration</div>
                <div className="text-[10px] text-muted-foreground">avg: {comparison.avgDuration}m</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={`flex items-center justify-center gap-1 text-lg font-bold ${getComparisonColor(comparison.vsAverage?.participants || 0)}`}>
                  {getComparisonIcon(comparison.vsAverage?.participants || 0)}
                  {Math.abs(comparison.vsAverage?.participants || 0)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Speakers</div>
                <div className="text-[10px] text-muted-foreground">avg: {comparison.avgParticipants?.toFixed(1)}</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={`flex items-center justify-center gap-1 text-lg font-bold ${getComparisonColor(comparison.vsAverage?.actionItems || 0)}`}>
                  {getComparisonIcon(comparison.vsAverage?.actionItems || 0)}
                  {Math.abs(comparison.vsAverage?.actionItems || 0)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Action Items</div>
                <div className="text-[10px] text-muted-foreground">avg: {comparison.avgActionItems?.toFixed(1)}</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg col-span-3 md:col-span-1">
                <div className="text-lg font-bold text-primary">{engagementScore}</div>
                <div className="text-xs text-muted-foreground mt-1">Engagement Score</div>
                <div className="text-[10px] text-muted-foreground">out of 100</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg col-span-3 md:col-span-2">
                <div className="text-lg font-bold text-foreground">
                  {meeting?.duration > 0 ? Math.round(totalWords / (meeting.duration / 60)) : 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Words per Minute</div>
                <div className="text-[10px] text-muted-foreground">conversation pace</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speaker Analytics with Donut Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Speaker Distribution</CardTitle>
            <CardDescription>Talk time breakdown by speaker</CardDescription>
          </CardHeader>
          <CardContent>
            {speakers && speakers.length > 0 ? (
              <div className="flex gap-6">
                {/* Mini Donut Chart */}
                <div className="relative flex-shrink-0">
                  <svg className="w-32 h-32 -rotate-90">
                    {speakers.map((speaker: any, index: number) => {
                      const offset = speakers.slice(0, index).reduce((sum: number, s: any) => sum + (s.total || 0), 0)
                      const hue = (index * 360 / speakers.length) % 360
                      return (
                        <circle
                          key={index}
                          cx="64" cy="64" r="48"
                          fill="none"
                          stroke={`hsl(${hue}, 70%, 50%)`}
                          strokeWidth="16"
                          strokeDasharray={`${(speaker.total || 0) * 3.01} 301`}
                          strokeDashoffset={`-${offset * 3.01}`}
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">{speakers.length}</div>
                      <div className="text-[10px] text-muted-foreground">speakers</div>
                    </div>
                  </div>
                </div>

                {/* Speaker List */}
                <div className="flex-1 space-y-2 max-h-48 overflow-y-auto">
                  {speakers.map((speaker: any, index: number) => {
                    const speakerName = speaker.speaker || `Speaker ${index + 1}`
                    const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i)
                      ? `Speaker ${speakerName.match(/\d+/)?.[0]}`
                      : speakerName
                    const hue = (index * 360 / speakers.length) % 360

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                        />
                        <span className="text-sm font-medium text-foreground truncate flex-1">{displayName}</span>
                        <span className="text-sm text-muted-foreground">{speaker.total || 0}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <IconUsers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No speaker data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speaker Details Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Speaker Statistics</CardTitle>
            <CardDescription>Detailed speaking metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {speakers && speakers.length > 0 ? (
              <div className="space-y-3">
                {speakers.map((speaker: any, index: number) => {
                  const speakerName = speaker.speaker || `Speaker ${index + 1}`
                  const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i)
                    ? `Speaker ${speakerName.match(/\d+/)?.[0]}`
                    : speakerName
                  const hue = (index * 360 / speakers.length) % 360

                  return (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{displayName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold">{speaker.total || 0}%</div>
                          <div className="text-[10px] text-muted-foreground">Talk Time</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{(speaker.words || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">Words</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{speaker.talks || 0}</div>
                          <div className="text-[10px] text-muted-foreground">Turns</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No speaker statistics available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topics & Keywords */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Topics & Keywords</CardTitle>
          <CardDescription>Main discussion points from this meeting</CardDescription>
        </CardHeader>
        <CardContent>
          {topics && topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topics.map((topic: any, index: number) => {
                const hue = (index * 25) % 360
                return (
                  <div
                    key={index}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-white transition-transform hover:scale-105"
                    style={{ backgroundColor: `hsl(${hue}, 70%, 45%)` }}
                  >
                    {topic.name}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconTags className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No topics extracted</p>
              <p className="text-xs mt-1">Topics are analyzed from the meeting transcription</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Action Items</CardTitle>
              <CardDescription>{actionItems?.length || 0} items generated from this meeting</CardDescription>
            </div>
            {actionItems && actionItems.length > 0 && (
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                  {actionItems.filter((i: any) => i.priority === 'urgent' || i.priority === 'high').length} High
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded">
                  {actionItems.filter((i: any) => i.priority !== 'urgent' && i.priority !== 'high').length} Normal
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {actionItems && actionItems.length > 0 ? (
            <div className="space-y-3">
              {actionItems.map((item: any, index: number) => (
                <div key={index} className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {item.priority && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${item.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              item.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {item.priority}
                          </span>
                        )}
                        {item.status && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${item.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {item.status}
                          </span>
                        )}
                        {item.assignee && (
                          <span className="text-xs text-muted-foreground">👤 {item.assignee}</span>
                        )}
                        {item.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            📅 {new Date(item.dueDate).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconListCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No action items</p>
              <p className="text-xs mt-1">Action items are extracted from the meeting content</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <IconChartPie className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Meeting Analytics Summary</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This {formatDuration(meeting?.duration)} meeting had {speakers?.length || 0} speakers discussing {topics?.length || 0} topics,
                generating {actionItems?.length || 0} action items with an engagement score of {engagementScore}/100.
              </p>
            </div>
            <Button onClick={() => router.push(`/dashboard/meeting/${meetingId}`)}>
              View Full Details
              <IconExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
