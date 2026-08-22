"use client"

import { useState, useRef, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import MeetingCard from "@/components/custom/MeetingCard"
import { ModernPagination } from "@/components/custom/ModernPagination"
import { IconCloudUpload, IconLoader2, IconX, IconList, IconLayoutGrid } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import useListParams from "@/hooks/use-list-params"
import ListToolbar from "@/components/custom/ListToolbar"
import { normalizeMeetingsResponse } from "@/lib/meetings"

interface Meeting {
  _id: string
  title: string
  description?: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  type?: string
  userRole?: 'owner' | 'editor' | 'viewer' | string
  isUpload?: boolean
  pinned?: boolean
  shareToken?: string
}

export default function UploadsPage() {
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const controls = useListParams({ defaultPageSize: 20, defaultType: 'upload' })

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [gridCols, setGridCols] = useState<1 | 2>(2)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (meetings.length === 0) setIsLoading(true)
        else controls.setIsFetching(true)

        const params: any = { ...controls.queryParams, search: controls.searchQuery }
        const response = await api.getMeetings(params as any)
        const { meetings: meetingsList, pagination } = normalizeMeetingsResponse(response, controls.pageSize)
        setMeetings(meetingsList)
        setTotalPages(pagination.totalPages || 1)
      } catch (error) {
        console.error("Error fetching meetings:", error)
        toast.error("Gagal memuat meeting")
        if (error instanceof ApiError) {
          if (error.status === 429) setLlmError('AI service rate-limited. Coba lagi sebentar atau tambahkan API key di Settings.');
          else if (error.diagnostics && error.diagnostics.fallback) setLlmError('AI service fallback occured. Hasil mungkin terbatas.');
        }
        setMeetings([])
      } finally {
        setIsLoading(false)
        controls.setIsFetching(false)
      }
    }

    if (isReady) fetchMeetings()
    else setIsLoading(false)
  }, [isReady, controls.page, controls.searchQuery, controls.pageSize, controls.filter, controls.type])

  useEffect(() => {
    controls.setPage(1)
  }, [controls.filter, controls.searchQuery, controls.type])

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'video/mp4', 'audio/x-m4a']
    const maxSize = 100 * 1024 * 1024 // 100MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan MP3, WAV, atau MP4.")
      return
    }
    
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 100MB.")
      return
    }
    
    setSelectedFile(file)
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !isReady) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Use real XHR progress tracking
      const response = await api.uploadFile(selectedFile, {
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      }, (progress) => {
        setUploadProgress(progress)
      })
      
      toast.success("File berhasil diupload! Transkripsi sedang diproses.")
      setSelectedFile(null)
      
      // Navigate to status page
      router.push(`/dashboard/status-meeting?id=${response.meeting._id}`)
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast.error(error.response?.data?.error || error.message || "Gagal mengupload file")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Format meeting data for MeetingCard
  const formatMeetingForCard = (meeting: Meeting) => ({
    id: meeting._id,
    tag: "#My Meeting",
    platform: "Upload",
    date: new Date(meeting.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    title: meeting.title || "Untitled Meeting",
    description: meeting.description || "Meeting sedang diproses...",
    type: "upload",
    status: meeting.status,
    userRole: meeting.userRole || 'owner',
    isPinned: meeting.pinned || false,
    shareToken: meeting.shareToken,
  })

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
              {/* Upload Dropzone */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div 
                      className={`border-2 border-dashed rounded-xl transition-colors ${
                          isDragging 
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10' 
                            : 'border-[var(--border)] bg-[var(--card)]'
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.mp4,.webm,audio/*,video/*"
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      
                      {selectedFile ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="rounded-full bg-[var(--primary)]/10 p-3 text-[var(--primary)] mb-4">
                            <IconCloudUpload className="h-6 w-6" />
                          </div>
                          <h2 className="text-[15px] font-semibold text-[var(--foreground)]">{selectedFile.name}</h2>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          
                          {isUploading && (
                              <div className="w-64 mt-4">
                              <div className="w-full bg-[var(--input)] rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300 ease-out" 
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-5">
                            <Button 
                              variant="outline"
                              onClick={() => setSelectedFile(null)}
                              disabled={isUploading}
                            >
                              <IconX className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              className="bg-[var(--primary)] hover:brightness-90 text-[var(--primary-foreground)]"
                              onClick={handleUpload}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                "Upload & Transcribe"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="rounded-full bg-[var(--primary-100)] p-3 text-[var(--primary)] mb-4">
                            <IconCloudUpload className="h-6 w-6" />
                          </div>
                          <h2 className="text-base font-semibold text-foreground">Upload A File To Generate A Transcript</h2>
                          <p className="mt-1 text-sm text-muted-foreground">Browse Or Drag And Drop MP3, WAV, Or MP4 Files. (Max Video Size 100MB)</p>
                          <Button 
                            className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Your Meeting
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Meeting History Header */}
              <div className="px-4 lg:px-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-[16px] font-semibold text-[var(--foreground)]">Meeting History</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">Cari Meeting Anda Yang Telah Dibuat</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full">
                      <ListToolbar controls={controls as any} hideType gridCols={gridCols} setGridCols={setGridCols} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Cards */}
              <div className="px-4 lg:px-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-[var(--foreground)]">Belum ada file yang diupload</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Upload file audio/video untuk memulai transkripsi</p>
                  </div>
                ) : (
                  <>
                    {llmError && (
                      <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-800">
                        <strong>AI Service:</strong> {llmError}
                      </div>
                      )}
                    <div className={`grid gap-4 ${gridCols === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                      {meetings.map((meeting) => (
                        <MeetingCard key={meeting._id} data={formatMeetingForCard(meeting)} />
                      ))}
                    </div>

                    <ModernPagination
                      currentPage={controls.page}
                      totalPages={totalPages}
                      totalItems={totalPages * controls.pageSize}
                      itemsPerPage={controls.pageSize}
                      onPageChange={(p) => controls.setPage(p)}
                      className="mt-6"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
