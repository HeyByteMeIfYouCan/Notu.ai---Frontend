"use client"

import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import React from "react"

interface ModernPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

export function ModernPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = ""
}: ModernPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    
    if (totalPages <= 7) return pages
    
    return pages.filter(p => {
      // Always show first and last
      if (p === 1 || p === totalPages) return true
      
      // Near start: Show 1, 2, 3, 4, 5
      if (currentPage <= 4) return p <= 5
      
      // Near end: Show last 5 pages
      if (currentPage >= totalPages - 3) return p >= totalPages - 4
      
      // Middle: Show current +/- 2
      return Math.abs(p - currentPage) <= 2
    })
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <span>
            Menampilkan <span className="font-semibold text-foreground">{startItem}</span> -{" "}
            <span className="font-semibold text-foreground">{endItem}</span> dari{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> hasil
          </span>
        ) : (
          <span>Tidak ada hasil</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 px-3 text-muted-foreground hover:text-foreground border-border/50 shadow-sm transition-colors rounded-lg"
        >
          <IconChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline font-medium">Sebelumnya</span>
        </Button>

        <div className="flex items-center gap-1 mx-1 sm:mx-2">
          {pageNumbers.map((p, i, arr) => (
            <React.Fragment key={p}>
              {i > 0 && arr[i - 1] !== p - 1 && (
                <span className="px-1 text-muted-foreground select-none">…</span>
              )}
              <Button
                variant={currentPage === p ? "default" : "ghost"}
                size="sm"
                className={`
                  w-9 h-9 p-0 font-medium transition-all rounded-lg
                  ${currentPage === p 
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }
                `}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-9 px-3 text-muted-foreground hover:text-foreground border-border/50 shadow-sm transition-colors rounded-lg"
        >
          <span className="hidden sm:inline font-medium">Selanjutnya</span>
          <IconChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  )
}
