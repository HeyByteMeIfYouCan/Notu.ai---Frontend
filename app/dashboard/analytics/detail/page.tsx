"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { DetailAnalyticsList } from "../components/DetailAnalyticsList"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

export default function DetailAnalyticsPage() {
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()
  
  const [detailMeetings, setDetailMeetings] = useState<any[]>([])
  const [detailPagination, setDetailPagination] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('date')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchDetailAnalytics = useCallback(async () => {
    if (!isReady) return
    
    try {
      setIsLoading(true)
      const response = await api.getDetailAnalyticsList({ 
        page: currentPage, 
        limit: 10, 
        sortBy, 
        filter,
        search: debouncedSearch || undefined
      })
      const data = (response as any).data
      setDetailMeetings(data.meetings)
      setDetailPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching detail analytics:", error)
      toast.error("Failed to load meeting list")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api, currentPage, sortBy, filter, debouncedSearch])

  useEffect(() => {
    fetchDetailAnalytics()
  }, [fetchDetailAnalytics])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filter, sortBy])

  const handleMeetingClick = (meetingId: string) => {
    router.push(`/dashboard/analytics/detail/${meetingId}`)
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
              {/* Header */}
              <div className="px-4 lg:px-8">
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Analytics
                  </Button>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Meeting Details</h1>
                <p className="text-base text-muted-foreground mt-2">
                  Analytics terperinci untuk setiap meeting individual
                </p>
              </div>

              {/* Content */}
              <div className="px-4 lg:px-8">
                <DetailAnalyticsList
                  meetings={detailMeetings}
                  pagination={detailPagination}
                  isLoading={isLoading}
                  onMeetingClick={handleMeetingClick}
                  onPageChange={setCurrentPage}
                  onSortChange={setSortBy}
                  onFilterChange={setFilter}
                  onSearchChange={setSearchQuery}
                  currentSort={sortBy}
                  currentFilter={filter}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
