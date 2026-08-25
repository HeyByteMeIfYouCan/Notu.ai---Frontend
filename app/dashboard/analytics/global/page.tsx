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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-8">
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Analytics
                  </Button>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Global Overview</h1>
                <p className="text-base text-muted-foreground mt-2">
                  Statistik komprehensif dari seluruh meeting dan produktivitas Anda
                </p>
              </div>

              {/* Content */}
              <div className="px-4 lg:px-8">
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
