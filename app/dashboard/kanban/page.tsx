"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import NewBoardModal from "@/components/custom/NewBoardModal"
import BoardCard from "@/components/custom/BoardCard"
import useListParams from "@/hooks/use-list-params"
import { IconPlus, IconLayoutBoard, IconSearch } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { ModernPagination } from "@/components/custom/ModernPagination"

interface Board {
  _id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer'
  canEdit?: boolean
  canDelete?: boolean
  pinned?: boolean
  shareToken?: string
}

export default function KanbanListPage() {
  const router = useRouter()
  const { api, isReady, user } = useApiWithAuth()
  const controls = useListParams({ defaultPageSize: 12 })
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const loadBoards = async () => {
      try {
        setIsLoading(true)
        // queryParams already contains search from searchQuery
        const params = { ...controls.queryParams }
        const res = await api.getBoards(params as any)
        const payload = res?.data || res
        // Handle both array and object response
        const boardsData = Array.isArray(payload) ? payload : (payload?.data || [])
        const pagination = payload?.pagination || {}
        setBoards(boardsData)
        setTotalPages(pagination.totalPages || 1)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load boards")
        setBoards([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isReady) loadBoards()
    else setIsLoading(false)
  }, [isReady, api, controls.page, controls.searchQuery, controls.filter, controls.source])

  const createBoardExample = async () => {
    try {
      toast.info("To create a board, go to a Meeting details page and click 'Generate Kanban'")
    } catch (error) {
      toast.error("Failed")
    }
  }

  // Determine layout buckets
  const pinnedBoards = boards.filter(b => b.pinned)
  const unpinnedBoards = boards.filter(b => !b.pinned)

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
            <div className="flex flex-col gap-6 py-6">
              
              {/* Header */}
              <div className="px-4 lg:px-6 mb-2">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">Kanban Boards</h2>
                    <p className="text-base text-muted-foreground mt-2 max-w-2xl">
                      Kelola dan kolaborasikan action items dari meeting secara efisien.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsModalOpen(true)} 
                    className="self-start sm:self-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl"
                  >
                    <IconPlus className="mr-2 h-4 w-4" /> Board Baru
                  </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center gap-0 rounded-xl border border-border bg-card overflow-hidden divide-x divide-border mt-4">
                  <div className="relative flex-1 min-w-[180px]">
                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input 
                      placeholder="Cari board..." 
                      value={controls.searchInput} 
                      onChange={(e:any)=>controls.setSearchInput(e.target.value)} 
                      className="h-10 pl-9 pr-4 bg-transparent border-none shadow-none rounded-none focus-visible:ring-0 text-sm" 
                    />
                  </div>
                  
                  <Select value={controls.filter} onValueChange={(v:any)=>controls.setFilter(v)}>
                    <SelectTrigger className="h-10 w-[140px] bg-transparent border-none shadow-none rounded-none focus:ring-0 text-sm text-muted-foreground">
                      <SelectValue placeholder="Semua Board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="mine">Board Saya</SelectItem>
                      <SelectItem value="shared">Dibagikan</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={controls.source || 'all'} onValueChange={(v:any)=>controls.setSource(v)}>
                    <SelectTrigger className="h-10 w-[160px] bg-transparent border-none shadow-none rounded-none focus:ring-0 text-sm text-muted-foreground">
                      <SelectValue placeholder="Sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Sumber</SelectItem>
                      <SelectItem value="generated">Dari Meeting</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={String(controls.pageSize)} onValueChange={(v:any)=>controls.setPageSize(Number(v))}>
                    <SelectTrigger className="h-10 w-[100px] bg-transparent border-none shadow-none rounded-none focus:ring-0 text-sm text-muted-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 / hal</SelectItem>
                      <SelectItem value="24">24 / hal</SelectItem>
                      <SelectItem value="48">48 / hal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            <div className="px-4 lg:px-6">
              {isLoading ? (
                <div className="flex h-[350px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Memuat data board...</p>
                  </div>
                </div>
              ) : boards.length === 0 ? (
                <div className="flex h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 text-center p-10">
                  <div className="p-4 rounded-full bg-primary/5 mb-4 ring-1 ring-primary/10">
                    <IconLayoutBoard className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Belum ada board</h3>
                  <p className="text-muted-foreground max-w-xs mt-2 text-sm leading-relaxed">Buat board baru secara manual atau *generate* otomatis dari halaman detail meeting.</p>
                  <Button variant="outline" className="mt-6 font-semibold rounded-xl shadow-sm" onClick={() => router.push('/dashboard/meeting')}>
                    Lihat Meeting Anda
                  </Button>
                </div>
              ) : (
              <div className="space-y-8 w-full">
                {/* Pinned Section */}
                {pinnedBoards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">Pinned Boards</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">{pinnedBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {pinnedBoards.map((b) => <BoardCard key={b._id} board={b} />)}
                    </div>
                  </section>
                )}

                {/* Main List - Unpinned */}
                {unpinnedBoards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        {controls.filter === 'all' ? 'Semua Board' : (controls.filter === 'mine' ? 'Board Saya' : 'Dibagikan dengan saya')}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-xs font-semibold">{unpinnedBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {unpinnedBoards.map((b) => <BoardCard key={b._id} board={b} />)}
                    </div>
                  </section>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-2">
                    <ModernPagination
                      currentPage={controls.page}
                      totalPages={totalPages}
                      totalItems={totalPages * controls.pageSize}
                      itemsPerPage={controls.pageSize}
                      onPageChange={(p) => controls.setPage(p)}
                      className="mt-6"
                    />
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </SidebarInset>
      <NewBoardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </SidebarProvider>
  )
}
