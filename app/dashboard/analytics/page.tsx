"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  IconChartBar, 
  IconListDetails, 
  IconArrowRight,
  IconTrendingUp,
  IconUsers,
  IconCalendarTime,
  IconListCheck,
  IconMicrophone,
  IconTags,
  IconClock,
  IconActivity,
  IconLayoutKanban
} from "@tabler/icons-react"

export default function AnalyticsPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-5 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Explore comprehensive insights, meeting trends, and productivity metrics
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span>Real-time Sync</span>
                  </div>
                </div>
              </div>

              {/* Main Navigation Gateway Cards */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Global Analytics Card */}
                  <Link href="/dashboard/analytics/global" className="group block">
                    <Card className="h-full p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                              <IconChartBar className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                Global Overview
                              </h2>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Aggregated Meeting Metrics
                              </span>
                            </div>
                          </div>
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:translate-x-0.5">
                            <IconArrowRight className="h-4 w-4" />
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          Analyze high-level productivity scores, 14-day meeting activity trends, speaker distribution, and overall task completion.
                        </p>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconTrendingUp className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Productivity Score</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconCalendarTime className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">14-Day Activity Trends</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconUsers className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Top Active Speakers</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconListCheck className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Cross-Board Tasks</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-primary font-medium">
                        <span>Open Global Analytics</span>
                        <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors">View insights &rarr;</span>
                      </div>
                    </Card>
                  </Link>

                  {/* Detail Analytics Card */}
                  <Link href="/dashboard/analytics/detail" className="group block">
                    <Card className="h-full p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                              <IconListDetails className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                Meeting Details
                              </h2>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Per-Meeting Intelligence
                              </span>
                            </div>
                          </div>
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:translate-x-0.5">
                            <IconArrowRight className="h-4 w-4" />
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          Deep-dive into each meeting's talk-time breakdown, participant ratios, extracted keyword tags, and action items.
                        </p>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconMicrophone className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Talk-Time Breakdown</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconTags className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Keyword & Topic Cloud</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconClock className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Duration & Engagement</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground">
                            <IconLayoutKanban className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">Extracted Action Items</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-primary font-medium">
                        <span>Browse Meeting Catalog</span>
                        <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors">View details &rarr;</span>
                      </div>
                    </Card>
                  </Link>
                </div>

                {/* Quick Highlights Strip */}
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
                    Analytics Capabilities
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-card flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <IconTrendingUp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Productivity Scoring</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">Algorithm based on task delivery</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <IconCalendarTime className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Activity Forecasting</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">14-day meeting trends & volume</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <IconUsers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Speaker Ratios</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">Talk time & participant share</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <IconListCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Kanban Integration</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">Action items synced to boards</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

