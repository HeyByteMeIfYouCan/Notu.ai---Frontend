"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  IconChartBar,
  IconChartLine,
  IconChartArea
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

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid - 5 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Meetings"
          value={meetings?.total || 0}
          subtitle={`${meetings?.completed || 0} completed`}
          icon={<IconCalendar className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Duration"
          value={`${Math.floor((totalDuration || 0) / 60)}h ${(totalDuration || 0) % 60}m`}
          subtitle="Across all meetings"
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
          subtitle="Active boards"
          icon={<IconLayoutKanban className="h-4 w-4" />}
        />
        <MetricCard
          title="This Week"
          value={thisWeekMeetings}
          subtitle="meetings"
          icon={<IconTrendingUp className="h-4 w-4" />}
          trend={weeklyChange !== 0 ? { value: weeklyChange, label: "vs last week" } : undefined}
        />
      </div>

      {/* Productivity Score + Stats Row */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Productivity Score - Large */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none"
                    stroke={productivityScore >= 70 ? "#22c55e" : productivityScore >= 40 ? "#eab308" : "#ef4444"}
                    strokeWidth="12"
                    strokeDasharray={`${productivityScore * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{productivityScore}</div>
                    <div className="text-xs text-muted-foreground">/ 100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {productivityScore >= 70 ? "Excellent!" : productivityScore >= 40 ? "Good progress" : "Room to improve"}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <IconPercentage className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-2xl font-bold text-foreground">{completionRate || 0}%</div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <IconTargetArrow className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-2xl font-bold text-foreground">{avgActionsPerMeeting}</div>
                <div className="text-xs text-muted-foreground">Avg Actions/Meeting</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <IconClock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-2xl font-bold text-foreground">
                  {avgDuration ? `${Math.round(avgDuration)}m` : "0m"}
                </div>
                <div className="text-xs text-muted-foreground">Avg Duration</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <IconUsers className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <div className="text-2xl font-bold text-foreground">
                  {Math.round((participants?.avg || 0) * 10) / 10}
                </div>
                <div className="text-xs text-muted-foreground">Avg Participants</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Meeting Trends - NOW WITH REAL DATA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Meeting Activity</CardTitle>
              <CardDescription>Last 14 days trend</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Line Chart"
              >
                <IconChartLine className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Bar Chart"
              >
                <IconChartBar className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-1.5 rounded-md transition-all ${chartType === 'area' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Area Chart"
              >
                <IconChartArea className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <MeetingTrendsChart data={trends || []} type={chartType} />
          </CardContent>
        </Card>

        {/* Meeting Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Types</CardTitle>
            <CardDescription>Distribution by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meetingsByType?.length > 0 ? (
                meetingsByType.map((type: any, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          type.type === 'online' ? 'bg-blue-500' :
                          type.type === 'realtime' ? 'bg-green-500' :
                          type.type === 'upload' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-foreground capitalize">{type.type || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{type.count}</span>
                        <span className="text-sm font-medium text-foreground">{type.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          type.type === 'online' ? 'bg-blue-500' :
                          type.type === 'realtime' ? 'bg-green-500' :
                          type.type === 'upload' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No meeting type data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status & Top Speakers Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Task Status */}
        <Card>
          <CardHeader>
            <CardTitle>Task Progress</CardTitle>
            <CardDescription>Action items across all boards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Tasks Overview */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Total Tasks</span>
                <span className="text-2xl font-bold">{tasks?.total || 0}</span>
              </div>
              
              {/* Status Breakdown */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-sm font-medium text-foreground">To Do</span>
                    </div>
                    <span className="text-sm font-medium">{tasks?.todo || 0}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-400 transition-all"
                      style={{ width: `${tasks?.total > 0 ? (tasks.todo / tasks.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium text-foreground">In Progress</span>
                    </div>
                    <span className="text-sm font-medium">{tasks?.['in-progress'] || 0}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${tasks?.total > 0 ? ((tasks['in-progress'] || 0) / tasks.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-foreground">Done</span>
                    </div>
                    <span className="text-sm font-medium">{tasks?.done || 0}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${tasks?.total > 0 ? (tasks.done / tasks.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Speakers - FIXED */}
        <Card>
          <CardHeader>
            <CardTitle>Top Speakers</CardTitle>
            <CardDescription>Most active across all meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSpeakers && topSpeakers.length > 0 ? (
                topSpeakers.slice(0, 5).map((speaker: any, index: number) => {
                  const speakerName = speaker.name || speaker._id || `Speaker ${index + 1}`
                  const displayName = speakerName.match(/^SPEAKER[_\s]*(\d+)$/i) 
                    ? `Speaker ${speakerName.match(/\d+/)?.[0]}` 
                    : speakerName
                  const initial = displayName.charAt(0).toUpperCase()
                  
                  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-pink-500']
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full"
                        style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{speaker.meetingCount || 0} meetings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{(speaker.totalWords || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">words</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <IconMessage className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No speaker data yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete more meetings to see speaker stats</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
          <CardDescription>Most discussed keywords across all meetings</CardDescription>
        </CardHeader>
        <CardContent>
          {topTopics && topTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTopics.slice(0, 25).map((topic: any, index: number) => {
                const size = index < 5 ? 'text-base px-4 py-2' : index < 10 ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'
                const opacity = Math.max(0.5, 1 - (index * 0.03))
                return (
                  <div
                    key={index}
                    className={`${size} bg-primary text-primary-foreground rounded-full font-medium transition-transform hover:scale-105 cursor-default`}
                    style={{ opacity }}
                  >
                    {topic.keyword}
                    <span className="ml-1 opacity-70">({topic.frequency})</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconChartPie className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No topics analyzed yet</p>
              <p className="text-xs text-muted-foreground mt-1">Topics are extracted from completed meeting transcriptions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
