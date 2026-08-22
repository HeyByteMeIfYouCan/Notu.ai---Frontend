"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { MeetingDetailAnalytics } from "../../components/MeetingDetailAnalytics"
import { useRouter } from "next/navigation"

export default function MeetingDetailPage() {
  const { api, isReady } = useApiWithAuth()
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string
  
  const [meetingData, setMeetingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchMeetingDetail = useCallback(async () => {
    if (!isReady || !meetingId) return
    
    try {
      setIsLoading(true)
      const response = await api.getMeetingDetailAnalytics(meetingId)
      setMeetingData((response as any).data)
    } catch (error) {
      console.error("Error fetching meeting detail:", error)
      toast.error("Failed to load meeting details")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api, meetingId])

  useEffect(() => {
    fetchMeetingDetail()
  }, [fetchMeetingDetail])

  const handleBack = () => {
    router.push('/dashboard/analytics/detail')
  }

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
              {/* Content */}
              <div className="px-4 lg:px-6">
                <MeetingDetailAnalytics
                  meetingId={meetingId}
                  data={meetingData}
                  isLoading={isLoading}
                  onBack={handleBack}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
