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
              
              {/* Header & Hero Section */}
              <div className="px-4 lg:px-6 mb-2">
                <div className="mb-8">
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-[var(--foreground)]">Kanban Boards</h2>
                  <p className="text-base text-muted-foreground mt-2 max-w-2xl">
                    Kelola dan kolaborasikan action items dari meeting secara visual dan efisien.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  {/* Action Card: New Board */}
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="group relative isolate flex flex-col w-full min-h-[140px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex h-full flex-col justify-between p-6">
                      <div className="flex items-start justify-between mb-4">
                         <div className="flex h-11 w-11 items-center justify-center rounded-xl text-primary bg-primary/10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300">
                            <IconPlus className="h-5 w-5" strokeWidth={2} />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[1.05rem] font-semibold tracking-tight text-foreground">Buat Board Baru</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground text-balance">
                          Mulai dari nol atau buat board kustom untuk melacak tugas tim Anda.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Action Card: Generate from Meeting */}
                  <button 
                    onClick={() => router.push('/dashboard/meeting')}
                    className="group relative isolate flex flex-col w-full min-h-[140px] overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex h-full flex-col justify-between p-6">
                      <div className="flex items-start justify-between mb-4">
                         <div className="flex h-11 w-11 items-center justify-center rounded-xl text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300">
                            <IconLayoutBoard className="h-5 w-5" strokeWidth={2} />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[1.05rem] font-semibold tracking-tight text-foreground">Generate dari Meeting</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground text-balance">
                          Buka detail meeting dan ubah hasil rangkuman menjadi action items.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* List Section */}
              <div className="px-4 lg:px-6">
                <h2 className="mb-1 text-xl font-semibold tracking-[-0.02em] text-foreground">Semua Kanban Anda</h2>
                <p className="mb-6 text-sm text-[var(--muted-foreground)]">Cari, kelola, atau buka kanban yang sedang aktif.</p>

                {/* Filter Toolbar (ListToolbar style) */}
                <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card p-1.5 shadow-sm">
                  <div className="relative flex-1 min-w-[200px]">
                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Cari board..." 
                      value={controls.searchInput} 
                      onChange={(e:any)=>controls.setSearchInput(e.target.value)} 
                      className="h-9 pl-9 pr-4 bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground" 
                    />
                  </div>
                  
                  <div className="h-5 w-px bg-border/50 hidden md:block"></div>

                  <Select value={controls.filter} onValueChange={(v:any)=>controls.setFilter(v)}>
                    <SelectTrigger className="h-9 w-[160px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
                      <SelectValue placeholder="Semua Board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Board</SelectItem>
                      <SelectItem value="mine">Board Saya</SelectItem>
                      <SelectItem value="shared">Dibagikan ke Saya</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="h-5 w-px bg-border/50 hidden md:block"></div>

                  <Select value={String(controls.pageSize)} onValueChange={(v:any)=>controls.setPageSize(Number(v))}>
                    <SelectTrigger className="h-9 w-[130px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 / halaman</SelectItem>
                      <SelectItem value="24">24 / halaman</SelectItem>
                      <SelectItem value="48">48 / halaman</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="h-5 w-px bg-border/50 hidden md:block"></div>

                  <Select value={controls.source || 'all'} onValueChange={(v:any)=>controls.setSource(v)}>
                    <SelectTrigger className="h-9 w-[160px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
                      <SelectValue placeholder="Sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Sumber</SelectItem>
                      <SelectItem value="generated">Dari Meeting</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
