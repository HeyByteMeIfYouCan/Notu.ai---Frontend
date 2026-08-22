"use client"

import { Button } from "@/components/ui/button"
import { IconChartBar, IconListDetails } from "@tabler/icons-react"

interface AnalyticsViewToggleProps {
  activeView: 'global' | 'detail'
  onViewChange: (view: 'global' | 'detail') => void
}

export function AnalyticsViewToggle({ activeView, onViewChange }: AnalyticsViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={activeView === 'global' ? "default" : "ghost"} 
        size="sm"
        className="gap-2"
        onClick={() => onViewChange('global')}
      >
        <IconChartBar className="h-4 w-4" />
        Global Analytics
      </Button>
      <Button
        variant={activeView === 'detail' ? "default" : "ghost"}
        size="sm"
        className="gap-2"
        onClick={() => onViewChange('detail')}
      >
        <IconListDetails className="h-4 w-4" />
        Detail Analytics
      </Button>
    </div>
  )
}
