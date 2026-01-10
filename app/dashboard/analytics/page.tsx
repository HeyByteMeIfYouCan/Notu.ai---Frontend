"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  IconChartBar, 
  IconListDetails, 
  IconArrowRight,
  IconChartPie,
  IconUsers
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
            <div className="flex flex-col gap-6 py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Choose an analytics view to explore your meeting insights
                </p>
              </div>

              {/* Menu Grid */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
                  {/* Global Analytics Card */}
                  <Link href="/dashboard/analytics/global">
                    <Card className="group hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                            <IconChartBar className="h-6 w-6" />
                          </div>
                          <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <CardTitle className="text-lg mt-4">Global Overview</CardTitle>
                        <CardDescription className="text-sm">
                          Comprehensive statistics across all your meetings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Productivity Score</span>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Meeting Trends</span>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Top Speakers</span>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Task Status</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Detail Analytics Card */}
                  <Link href="/dashboard/analytics/detail">
                    <Card className="group hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                            <IconListDetails className="h-6 w-6" />
                          </div>
                          <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <CardTitle className="text-lg mt-4">Meeting Details</CardTitle>
                        <CardDescription className="text-sm">
                          In-depth analytics for each individual meeting
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Speaker Distribution</span>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Talk Time</span>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Topics</span>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Action Items</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Quick Stats Preview */}
                <div className="mt-8 grid gap-4 md:grid-cols-4 max-w-4xl">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <IconChartPie className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Analytics</p>
                          <p className="text-sm font-medium">2 Views Available</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <IconUsers className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Premium Feature</p>
                          <p className="text-sm font-medium">Full Access</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
