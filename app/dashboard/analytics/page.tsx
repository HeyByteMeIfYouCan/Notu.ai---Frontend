"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  IconChartBar,
  IconListDetails,
  IconArrowRight,
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

              {/* Hero Section */}
              <div className="px-4 lg:px-6 mb-2">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">
                      Analytics Dashboard
                    </h2>
                    <p className="text-base text-muted-foreground mt-2 max-w-2xl">
                      Wawasan mendalam tentang produktivitas, pola meeting, dan action items tim Anda.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-400 self-start sm:self-auto shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Sinkronisasi real-time
                  </div>
                </div>

                {/* Main Navigation Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Global Analytics */}
                  <Link href="/dashboard/analytics/global" className="group block h-full">
                    <div className="relative isolate flex flex-col w-full h-full min-h-[220px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="absolute top-0 right-0 p-6 opacity-0 translate-x-4 -translate-y-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <IconArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex h-full flex-col justify-between p-6">
                        <div className="flex items-start justify-between mb-8">
                           <div className="flex h-12 w-12 items-center justify-center rounded-xl text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300">
                              <IconChartBar className="h-6 w-6" strokeWidth={2} />
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/70 dark:text-indigo-400/70">Overview</span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-[1.1rem] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">Global Overview</h3>
                          <p className="text-sm leading-relaxed text-muted-foreground text-balance">
                            Analisis metrik agregat dari semua meeting Anda. Termasuk skor produktivitas, tren aktivitas 14 hari, dan distribusi speaker.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Meeting Details */}
                  <Link href="/dashboard/analytics/detail" className="group block h-full">
                    <div className="relative isolate flex flex-col w-full h-full min-h-[220px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="absolute top-0 right-0 p-6 opacity-0 translate-x-4 -translate-y-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <IconArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex h-full flex-col justify-between p-6">
                        <div className="flex items-start justify-between mb-8">
                           <div className="flex h-12 w-12 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300">
                              <IconListDetails className="h-6 w-6" strokeWidth={2} />
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">Per-Meeting</span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-[1.1rem] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">Meeting Details</h3>
                          <p className="text-sm leading-relaxed text-muted-foreground text-balance">
                            Telusuri analitik mendalam untuk setiap meeting. Lihat porsi bicara speaker, keyword cloud, dan efektivitas diskusi.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
