"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
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
  IconSparkles,
} from "@tabler/icons-react"

const capabilities = [
  {
    icon: <IconTrendingUp className="h-4 w-4" />,
    label: "Productivity Score",
    desc: "Efisiensi meeting & eksekusi tugas",
  },
  {
    icon: <IconCalendarTime className="h-4 w-4" />,
    label: "Activity Trends",
    desc: "Volume meeting 14 hari terakhir",
  },
  {
    icon: <IconUsers className="h-4 w-4" />,
    label: "Speaker Ratios",
    desc: "Distribusi bicara tiap peserta",
  },
  {
    icon: <IconListCheck className="h-4 w-4" />,
    label: "Kanban Sync",
    desc: "Action items tersinkron ke board",
  },
]

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
        <div className="flex flex-1 flex-col bg-background">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-8 py-8">

              {/* Page Header */}
              <div className="px-4 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-foreground">
                      Analytics
                    </h1>
                    <p className="text-base text-muted-foreground mt-2">
                      Wawasan mendalam dari setiap meeting — produktivitas, speaker, hingga action items.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-time Sync
                  </div>
                </div>
              </div>

              {/* Gateway Cards */}
              <div className="px-4 lg:px-8">
                <div className="grid gap-4 md:grid-cols-2">

                  {/* Global Analytics */}
                  <Link href="/dashboard/analytics/global" className="group block">
                    <div className="h-full p-5 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-5 relative overflow-hidden">
                      {/* Subtle background accent */}
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300 pointer-events-none" />

                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200 shrink-0">
                            <IconChartBar className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              Global Overview
                            </h2>
                            <span className="text-xs text-muted-foreground">
                              Aggregated meeting metrics
                            </span>
                          </div>
                        </div>
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0">
                          <IconArrowRight className="h-4 w-4" />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Analisis skor produktivitas, tren aktivitas 14 hari, distribusi speaker, dan penyelesaian task di semua meeting Anda.
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: <IconTrendingUp className="h-3.5 w-3.5" />, label: "Productivity Score" },
                          { icon: <IconCalendarTime className="h-3.5 w-3.5" />, label: "14-Day Trends" },
                          { icon: <IconUsers className="h-3.5 w-3.5" />, label: "Top Speakers" },
                          { icon: <IconListCheck className="h-3.5 w-3.5" />, label: "Cross-Board Tasks" },
                        ].map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 text-xs font-medium text-foreground">
                            <span className="text-primary">{f.icon}</span>
                            <span className="truncate">{f.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <span>Buka Global Analytics</span>
                        <IconArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>

                  {/* Meeting Details */}
                  <Link href="/dashboard/analytics/detail" className="group block">
                    <div className="h-full p-5 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-5 relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300 pointer-events-none" />

                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200 shrink-0">
                            <IconListDetails className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              Meeting Details
                            </h2>
                            <span className="text-xs text-muted-foreground">
                              Per-meeting intelligence
                            </span>
                          </div>
                        </div>
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0">
                          <IconArrowRight className="h-4 w-4" />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Telusuri setiap meeting: breakdown talk-time per speaker, rasio peserta, tag kata kunci, dan action items yang dihasilkan.
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: <IconMicrophone className="h-3.5 w-3.5" />, label: "Talk-Time Breakdown" },
                          { icon: <IconTags className="h-3.5 w-3.5" />, label: "Keyword & Topics" },
                          { icon: <IconClock className="h-3.5 w-3.5" />, label: "Duration & Engagement" },
                          { icon: <IconListCheck className="h-3.5 w-3.5" />, label: "Extracted Actions" },
                        ].map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 text-xs font-medium text-foreground">
                            <span className="text-primary">{f.icon}</span>
                            <span className="truncate">{f.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <span>Telusuri Meeting Catalog</span>
                        <IconArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Capabilities Strip */}
              <div className="px-4 lg:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Fitur Tersedia
                </p>
                <div className="flex flex-wrap gap-2">
                  {capabilities.map((cap, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm"
                    >
                      <span className="text-primary shrink-0">{cap.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{cap.label}</p>
                        <p className="text-[11px] text-muted-foreground">{cap.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
