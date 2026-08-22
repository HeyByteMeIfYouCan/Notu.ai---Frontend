"use client"

import React from "react"

interface Props {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  maxButtons?: number
}

const Pagination: React.FC<Props> = ({ page, totalPages, onPageChange, maxButtons = 7 }) => {
  if (totalPages <= 1) return null

  const buildPages = () => {
    const pages: (number | "ellipsis")[] = []
    const max = Math.max(3, maxButtons)
    if (totalPages <= max) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    const displayCount = max - 2 // reserve slots for first and last
    let start = Math.max(2, page - Math.floor(displayCount / 2))
    let end = Math.min(totalPages - 1, start + displayCount - 1)
    start = Math.max(2, end - displayCount + 1)

    pages.push(1)
    if (start > 2) pages.push("ellipsis")
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push("ellipsis")
    pages.push(totalPages)

    return pages
  }

  const pages = buildPages()

  const handleClick = (p: number) => {
    if (p < 1) p = 1
    if (p > totalPages) p = totalPages
    if (p === page) return
    onPageChange(p)
  }

  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <button
        onClick={() => handleClick(page - 1)}
        disabled={page <= 1}
        className="px-2 py-1 rounded border bg-[var(--card)] hover:bg-[var(--input)] disabled:opacity-50"
      >
        Prev
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`e-${idx}`} className="px-2 py-1 text-sm text-gray-500">…</span>
          ) : (
            <button
              key={p}
              onClick={() => handleClick(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-[36px] px-3 py-1 rounded text-sm border ${
                p === page ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--card)] hover:bg-[var(--input)] text-[var(--muted-foreground)]"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => handleClick(page + 1)}
        disabled={page >= totalPages}
        className="px-2 py-1 rounded border bg-[var(--card)] hover:bg-[var(--input)] disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  )
}

export default Pagination
