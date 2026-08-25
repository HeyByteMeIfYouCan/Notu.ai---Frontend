"use client"

import { useMemo, useState } from "react"

interface TrendDataPoint {
  _id: string // date string YYYY-MM-DD
  count: number
  duration: number
  completed?: number
}

interface MeetingTrendsChartProps {
  data: TrendDataPoint[]
  className?: string
  type?: 'line' | 'bar' | 'area'
}

export function MeetingTrendsChart({ data, className, type = 'line' }: MeetingTrendsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Take last 14 days for better visualization
    const recentData = data.slice(-14)
    const maxCount = Math.max(...recentData.map(d => d.count), 1)
    
    return recentData.map((d, index) => ({
      index,
      date: d._id,
      count: d.count,
      duration: Math.round(d.duration / 60), // to minutes
      height: (d.count / maxCount) * 100,
      normalizedY: 100 - (d.count / maxCount) * 100,
      dayLabel: new Date(d._id).toLocaleDateString('id-ID', { weekday: 'short' }),
      dateLabel: new Date(d._id).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      fullDate: new Date(d._id).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    }))
  }, [data])

  const totalMeetings = useMemo(() => 
    chartData.reduce((sum, d) => sum + d.count, 0), [chartData])
  
  const totalDuration = useMemo(() => 
    chartData.reduce((sum, d) => sum + d.duration, 0), [chartData])

  const avgMeetingsPerDay = useMemo(() => 
    chartData.length > 0 ? (totalMeetings / chartData.length).toFixed(1) : '0', [chartData, totalMeetings])

  // Generate smooth curve path using bezier
  const curvePath = useMemo(() => {
    if (chartData.length < 2) return ''
    
    const width = 100 / chartData.length
    const points = chartData.map((d, i) => ({
      x: (i * width) + (width / 2),
      y: d.normalizedY
    }))
    
    // Create smooth bezier curve
    let path = `M ${points[0].x},${points[0].y}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const cpX = (current.x + next.x) / 2
      
      path += ` C ${cpX},${current.y} ${cpX},${next.y} ${next.x},${next.y}`
    }
    
    return path
  }, [chartData])

  // Generate area path
  const areaPath = useMemo(() => {
    if (chartData.length < 2) return ''
    
    const width = 100 / chartData.length
    const points = chartData.map((d, i) => ({
      x: (i * width) + (width / 2),
      y: d.normalizedY
    }))
    
    const firstX = points[0].x
    const lastX = points[points.length - 1].x
    
    let path = `M ${firstX},100 L ${firstX},${points[0].y}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const cpX = (current.x + next.x) / 2
      
      path += ` C ${cpX},${current.y} ${cpX},${next.y} ${next.x},${next.y}`
    }
    
    path += ` L ${lastX},100 Z`
    
    return path
  }, [chartData])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p>No meeting data available</p>
          <p className="text-xs mt-1 opacity-70">Complete meetings to see trends</p>
        </div>
      </div>
    )
  }

  const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null

  return (
    <div className={className}>
      {/* Chart Container */}
      <div className="relative h-44 rounded-xl bg-muted/30 p-4">
        {/* Hover Info Tooltip */}
        {hoveredData && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-4 py-2 rounded-lg shadow-xl border border-border z-20 animate-in fade-in-0 zoom-in-95 pointer-events-none"
          >
            <div className="text-center">
              <div className="font-semibold text-foreground text-xs">{hoveredData.fullDate}</div>
              <div className="flex items-center justify-center gap-3 mt-1 text-xs">
                <span className="text-primary font-semibold">{hoveredData.count} meetings</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{hoveredData.duration} min</span>
              </div>
            </div>
          </div>
        )}

        {/* Grid Lines */}
        <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] pointer-events-none opacity-30">
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
        </svg>

        {/* SVG Chart */}
        <svg 
          className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="90%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Area Fill - For Area chart or Line chart background */}
          {(type === 'area' || type === 'line') && (
             <path
             d={areaPath}
             fill="url(#areaGradient)"
             opacity={type === 'line' ? 0.3 : 0.8}
             className="transition-all duration-300"
           />
          )}

          {/* Line Chart */}
          {(type === 'line' || type === 'area') && (
            <path
              d={curvePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="transition-all duration-300"
            />
          )}
          
          {/* Data Points / Bars */}
          {chartData.map((d, i) => {
            const width = 100 / chartData.length
            const x = (i * width) + (width / 2)
            const isHovered = hoveredIndex === i
            
            return (
              <g key={d.date}>
                {/* Hover area (invisible but clickable) */}
                <rect
                  x={i * width}
                  y="0"
                  width={width}
                  height="100"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Bar Chart */}
                {type === 'bar' && (
                  <rect
                    x={(i * width) + (width * 0.2)} 
                    y={d.normalizedY}
                    width={width * 0.6}
                    height={d.height}
                    rx="1"
                    fill={isHovered ? "hsl(var(--primary))" : "url(#barGradient)"}
                    className="transition-all duration-300"
                    opacity={isHovered ? 1 : 0.8}
                  />
                )}
                
                {/* Vertical line on hover (Line/Area only) */}
                {isHovered && type !== 'bar' && (
                  <line
                    x1={x} y1="0" x2={x} y2="100"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    opacity="0.5"
                  />
                )}
                
                {/* Data point (Line/Area only) */}
                {(type === 'line' || type === 'area') && (
                  <circle
                    cx={x}
                    cy={d.normalizedY}
                    r={isHovered ? "2.5" : "1.5"}
                    fill={isHovered ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))"}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    className="transition-all duration-200"
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* X-axis labels */}
      <div className="flex gap-1 mt-3 px-4">
        {chartData.map((d, i) => (
          <div 
            key={d.date} 
            className={`flex-1 text-center transition-all duration-200 ${
              hoveredIndex === i ? 'text-primary font-medium' : ''
            }`}
          >
            <div className="text-[10px] text-muted-foreground">{d.dayLabel}</div>
            {hoveredIndex === i && (
              <div className="text-[9px] text-primary opacity-80">{d.dateLabel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
