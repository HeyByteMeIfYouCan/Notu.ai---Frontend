"use client"

import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number // percentage
    label: string
  }
}

export function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <Card className="p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-200 shadow-xs hover:shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
        {icon && (
          <div className="flex items-center justify-center p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
              trend.value > 0
                ? "bg-primary/10 text-primary"
                : trend.value < 0
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "•"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{subtitle}</p>
      )}
    </Card>
  )
}

