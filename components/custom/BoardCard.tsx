"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconLayoutBoard } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface BoardCardProps {
  board: {
    _id: string
    title: string
    description?: string
    updatedAt: string
    labels?: { name: string }[] | string[]
    userRole?: 'owner' | 'admin' | 'editor' | 'viewer'
    userId?: { name?: string; _id?: string }
  }
}

export default function BoardCard({ board }: BoardCardProps) {
  const router = useRouter()

  const roleLabel = board.userRole === 'owner' ? 'My Board' : 'Shared'
  const roleBadgeColor = board.userRole === 'owner' 
    ? 'bg-purple-100 text-purple-700' 
    : 'bg-blue-100 text-blue-700'

  return (
    <Card
      onClick={() => router.push(`/dashboard/kanban/${board._id}`)}
      className="cursor-pointer hover:shadow-lg transition-shadow"
      style={{ borderRadius: 'var(--kanban-card-radius)', boxShadow: 'var(--kanban-card-shadow)', background: 'var(--kanban-card-bg)' }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-3 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <IconLayoutBoard className="h-5 w-5" style={{ color: 'var(--kanban-primary)' }} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-[var(--kanban-card-foreground)] line-clamp-1">{board.title}</CardTitle>
              <CardDescription className="text-xs text-[var(--kanban-muted)] line-clamp-2">{board.description || 'No description'}</CardDescription>
            </div>
          </div>
          <div className="text-xs text-[var(--kanban-muted)]">{new Date(board.updatedAt).toLocaleDateString()}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {board.labels && board.labels.slice(0,3).map((l: any) => (
              <span key={l.name || l} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--kanban-column-bg)] text-[var(--kanban-muted)]">{l.name || l}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>{roleLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
