"use client"

import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
  }
}

export function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-200 shadow-xs hover:shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{title}</span>
        {icon && (
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-3xl font-bold tracking-[-0.03em] text-foreground">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.value > 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : trend.value < 0
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "—"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1.5 truncate">{subtitle}</p>
      )}
    </Card>
  )
}
