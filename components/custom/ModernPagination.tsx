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
    <div className={`flex items-center justify-between border-t bg-card pt-4 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <span>
            Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-medium text-foreground">{endItem}</span> of{" "}
            <span className="font-medium text-foreground">{totalItems}</span> results
          </span>
        ) : (
          <span>No results found</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 px-3 hover:bg-accent hover:text-accent-foreground border-border transition-colors"
        >
          <IconChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i, arr) => (
            <React.Fragment key={p}>
              {i > 0 && arr[i - 1] !== p - 1 && (
                <span className="px-2 text-muted-foreground select-none">…</span>
              )}
              <Button
                variant={currentPage === p ? "default" : "outline"}
                size="sm"
                className={`
                  w-9 h-9 p-0 font-medium transition-all
                  ${currentPage === p 
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
                    : 'border-border hover:bg-accent hover:text-accent-foreground hover:border-accent'
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
          className="h-9 px-3 hover:bg-accent hover:text-accent-foreground border-border transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <IconChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
