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
import { IconPlus, IconLayoutBoard } from "@tabler/icons-react"
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
        <div className="flex min-h-screen flex-col bg-slate-50/50">
          <div className="flex flex-1 flex-col p-6 lg:p-10 gap-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Kanban Boards</h1>
                    <p className="text-sm text-muted-foreground">Manage and collaborate on meeting tasks efficiently.</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="hidden sm:block">
                        <Input placeholder="Search boards..." value={controls.searchInput} onChange={(e:any)=>controls.setSearchInput(e.target.value)} className="w-64" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={controls.filter} onValueChange={(v:any)=>controls.setFilter(v)}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="mine">My Boards</SelectItem>
                            <SelectItem value="shared">Shared with me</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={controls.source || 'all'} onValueChange={(v:any)=>controls.setSource(v)}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Source</SelectItem>
                            <SelectItem value="generated">Generated from Meeting</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={String(controls.pageSize)} onValueChange={(v:any)=>controls.setPageSize(Number(v))}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder={`${controls.pageSize} / page`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="20">20 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={() => setIsModalOpen(true)} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                          <IconPlus className="mr-2 h-4 w-4" /> New Board
                        </Button>
                    </div>
            </div>

            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-card">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm font-medium text-muted-foreground">Loading your boards...</p>
                </div>
              </div>
            ) : boards.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card text-center p-10">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <IconLayoutBoard className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No boards found</h3>
                <p className="text-muted-foreground max-w-xs mt-2">Generate a board from your meeting notes to get started with task management.</p>
                <Button variant="outline" className="mt-6 font-semibold" onClick={() => router.push('/dashboard/meeting')}>
                  Go to Meetings
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
                      <h2 className="text-xl font-semibold text-foreground">
                        {controls.filter === 'all' ? 'All Boards' : (controls.filter === 'mine' ? 'My Boards' : 'Shared with me')}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">{unpinnedBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {unpinnedBoards.map((b) => <BoardCard key={b._id} board={b} />)}
                    </div>
                  </section>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <ModernPagination
                    currentPage={controls.page}
                    totalPages={totalPages}
                    totalItems={totalPages * controls.pageSize}
                    itemsPerPage={controls.pageSize}
                    onPageChange={(p) => controls.setPage(p)}
                    className="mt-6"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
      <NewBoardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </SidebarProvider>
  )
}
