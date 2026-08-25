"use client"

import { useState, useEffect, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { GlobalAnalytics } from "../components/GlobalAnalytics"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export default function GlobalAnalyticsPage() {
  const { api, isReady } = useApiWithAuth()
  
  const [globalData, setGlobalData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchGlobalAnalytics = useCallback(async () => {
    if (!isReady) return
    
    try {
      setIsLoading(true)
      const response = await api.getGlobalAnalytics()
      setGlobalData((response as any).data)
    } catch (error) {
      console.error("Error fetching global analytics:", error)
      toast.error("Failed to load global analytics")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api])

  useEffect(() => {
    fetchGlobalAnalytics()
  }, [fetchGlobalAnalytics])

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
              <div className="px-4 lg:px-6 mb-2">
                <div className="mb-6">
                  <Link href="/dashboard/analytics" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <IconArrowLeft className="h-4 w-4" />
                    Kembali ke Analytics
                  </Link>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">Global Overview</h2>
                  <p className="text-base text-muted-foreground mt-2 max-w-2xl">
                    Statistik komprehensif dari seluruh meeting dan produktivitas Anda.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 lg:px-6">
                <GlobalAnalytics 
                  data={globalData} 
                  isLoading={isLoading} 
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
