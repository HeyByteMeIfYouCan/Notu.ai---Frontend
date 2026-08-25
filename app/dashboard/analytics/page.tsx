"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  IconChartBar,
  IconListDetails,
  IconArrowUpRight,
  IconTrendingUp,
  IconUsers,
  IconCalendarStats,
  IconListCheck,
  IconMicrophone,
  IconTags,
  IconClock,
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
        <div className="flex flex-1 flex-col bg-background">
          <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-10 py-8 px-4 lg:px-8">

              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Notu.ai</p>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                    Wawasan mendalam tentang produktivitas, pola meeting, dan action items tim Anda.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sinkronisasi real-time
                </div>
              </div>

              {/* Main Navigation Cards */}
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">

                {/* Global Analytics */}
                <Link href="/dashboard/analytics/global" className="group block">
                  <div className="relative h-full flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all duration-150 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
                          <IconChartBar className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Global Overview</h2>
                          <p className="text-xs text-muted-foreground">Metrik agregat semua meeting</p>
                        </div>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground group-hover:text-foreground transition-colors">
                        <IconArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
                      Analisis skor produktivitas, tren aktivitas 14 hari, distribusi speaker, dan penyelesaian task lintas semua meeting Anda.
                    </p>

                    {/* Feature grid */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {[
                        { icon: <IconTrendingUp className="h-3.5 w-3.5" />, label: "Productivity Score" },
                        { icon: <IconCalendarStats className="h-3.5 w-3.5" />, label: "14-Day Trends" },
                        { icon: <IconUsers className="h-3.5 w-3.5" />, label: "Top Speakers" },
                        { icon: <IconListCheck className="h-3.5 w-3.5" />, label: "Cross-Board Tasks" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="shrink-0 opacity-60">{f.icon}</span>
                          {f.label}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                        Buka Global Analytics →
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Meeting Details */}
                <Link href="/dashboard/analytics/detail" className="group block">
                  <div className="relative h-full flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all duration-150 overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
                          <IconListDetails className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Meeting Details</h2>
                          <p className="text-xs text-muted-foreground">Per-meeting intelligence</p>
                        </div>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground group-hover:text-foreground transition-colors">
                        <IconArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
                      Telusuri setiap meeting: breakdown talk-time per speaker, rasio peserta, keyword cloud, dan action items yang dihasilkan AI.
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {[
                        { icon: <IconMicrophone className="h-3.5 w-3.5" />, label: "Talk-Time Breakdown" },
                        { icon: <IconTags className="h-3.5 w-3.5" />, label: "Keyword & Topics" },
                        { icon: <IconClock className="h-3.5 w-3.5" />, label: "Duration & Engagement" },
                        { icon: <IconListCheck className="h-3.5 w-3.5" />, label: "Extracted Actions" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="shrink-0 opacity-60">{f.icon}</span>
                          {f.label}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                        Telusuri Meeting Catalog →
                      </span>
                    </div>
                  </div>
                </Link>

              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
