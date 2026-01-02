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

interface Board {
  _id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer'
  canEdit?: boolean
  canDelete?: boolean
}

export default function KanbanListPage() {
  const router = useRouter()
  const { api, isReady, user } = useApiWithAuth()
  const controls = useListParams({ defaultPageSize: 12 })
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        setBoards(boardsData)
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

  // Use userRole from backend for reliable ownership detection
  const myBoards = boards.filter(b => b.userRole === 'owner')
  const sharedBoards = boards.filter(b => b.userRole && b.userRole !== 'owner')

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
          <div className="flex flex-1 flex-col p-6 lg:p-10 gap-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>Kanban Boards</h1>
                    <p className="mt-2 font-medium" style={{ color: 'var(--kanban-muted)' }}>Manage and collaborate on meeting tasks efficiently.</p>
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
                      </div>
                      <Button onClick={() => setIsModalOpen(true)} size="lg" className="rounded-full px-6 shadow-lg" style={{ background: 'var(--kanban-primary)', color: 'var(--kanban-primary-foreground)' }}>
                          <IconPlus className="mr-2 h-5 w-5" /> New Board
                        </Button>
                    </div>
            </div>

            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed bg-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-slate-500">Loading your boards...</p>
                </div>
              </div>
            ) : boards.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white text-center p-10">
                <div className="p-4 rounded-full bg-slate-50 mb-4">
                  <IconLayoutBoard className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No boards found</h3>
                <p className="text-slate-500 max-w-xs mt-2">Generate a board from your meeting notes to get started with task management.</p>
                <Button variant="outline" className="mt-6 font-semibold" onClick={() => router.push('/dashboard/meeting')}>
                  Go to Meetings
                </Button>
              </div>
            ) : (
              <div className="space-y-8 w-full">
                {controls.filter === 'all' && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>My Boards</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--kanban-column-bg)] text-[var(--kanban-muted)] text-[11px] font-bold">{myBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {myBoards.map((b) => <BoardCard key={b._id} board={b} />)}
                    </div>
                  </section>
                )}

                {controls.filter === 'all' && sharedBoards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Shared with me</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--kanban-column-bg)] text-[var(--kanban-muted)] text-[11px] font-bold">{sharedBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {sharedBoards.map((b) => <BoardCard key={b._id} board={b} />)}
                    </div>
                  </section>
                )}

                {controls.filter !== 'all' && (
                  <section>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{controls.filter === 'mine' ? 'My Boards' : 'Shared with me'}</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--kanban-column-bg)] text-[var(--kanban-muted)] text-[11px] font-bold">{controls.filter === 'mine' ? myBoards.length : sharedBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                      {(controls.filter === 'mine' ? myBoards : sharedBoards).map((b) => <BoardCard key={b._id} board={b} />)}
                    </div>
                  </section>
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
