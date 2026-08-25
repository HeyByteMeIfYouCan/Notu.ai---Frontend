"use client"

import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label: string }
}

export function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
        {icon && (
          <div className="shrink-0 text-muted-foreground opacity-50">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold tabular-nums ${
            trend.value > 0 ? "text-emerald-600 dark:text-emerald-400" :
            trend.value < 0 ? "text-destructive" : "text-muted-foreground"
          }`}>
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground -mt-1 truncate">{subtitle}</p>
      )}
    </div>
  )
}
