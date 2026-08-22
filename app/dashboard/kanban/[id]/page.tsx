"use client"

import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useParams } from "next/navigation"

export default function BoardDetailPage() {
  const params = useParams()
  const boardId = params.id as string

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
        <KanbanBoard boardId={boardId} />
      </SidebarInset>
    </SidebarProvider>
  )
}
