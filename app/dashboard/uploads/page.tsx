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
        <div className="flex flex-1 flex-col bg-background">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-8">
              
              {/* Page Title */}
              <div className="px-4 lg:px-8 mb-2">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">
                  Upload file meeting
                </h2>
                <p className="text-base text-muted-foreground mt-2">
                  Pilih audio atau video, lalu Notu akan mengubahnya menjadi notulen.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="px-4 lg:px-8">
                <div 
                  className={`group relative flex flex-col items-center justify-center p-12 min-h-[300px] border-2 border-dashed rounded-[1.5rem] bg-card text-center transition-all duration-300 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${
                      isDragging 
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5' 
                        : 'border-border/60'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.mp4,.webm,audio/*,video/*"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                      <div className="rounded-full bg-[var(--primary)]/10 p-4 text-[var(--primary)] mb-5 ring-1 ring-primary/20">
                        <IconCloudUpload className="h-8 w-8" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)] truncate w-full px-4">{selectedFile.name}</h2>
                      <p className="mt-1.5 text-sm text-[var(--muted-foreground)] bg-muted px-2.5 py-0.5 rounded-md">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      
                      {isUploading && (
                          <div className="w-full mt-6">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
                            <div 
                              className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300 ease-out" 
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs font-medium text-[var(--muted-foreground)] mt-2.5">
                            {uploadProgress < 100 ? `Mengunggah... ${uploadProgress}%` : 'Memproses transkrip...'}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex w-full gap-3 mt-8">
                        <Button 
                          variant="outline"
                          className="flex-1 rounded-xl shadow-sm"
                          onClick={() => setSelectedFile(null)}
                          disabled={isUploading}
                        >
                          <IconX className="h-4 w-4 mr-2" />
                          Batal
                        </Button>
                        <Button 
                          className="flex-1 rounded-xl bg-[var(--primary)] hover:brightness-90 text-[var(--primary-foreground)] shadow-sm"
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                              Mengunggah...
                            </>
                          ) : (
                            "Upload Sekarang"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto pointer-events-none">
                      <div className="rounded-2xl bg-primary/10 p-4 text-primary mb-6 ring-1 ring-primary/20 shadow-sm group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary/40 transition-all duration-300">
                        <IconCloudUpload className="h-8 w-8" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">Upload file untuk ditranskrip</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed text-balance">
                        Tarik & lepas file MP3, WAV, atau MP4 di sini, atau klik tombol di bawah untuk menelusuri.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/60 font-medium tracking-wide">(Maksimal ukuran file 100MB)</p>
                      <Button 
                        className="mt-8 rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm group-hover:shadow-md pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Pilih File Meeting
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting History Section */}
              <div className="px-4 lg:px-8 mt-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Riwayat Upload</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Daftar rekaman yang telah Anda unggah.</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6">
                  <ListToolbar controls={controls as any} hideType gridCols={gridCols} setGridCols={setGridCols} />
                </div>
              </div>

              {/* Meeting Cards */}
              <div className="px-4 lg:px-8">
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
