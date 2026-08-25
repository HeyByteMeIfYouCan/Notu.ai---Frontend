"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { IconSearch, IconList, IconLayoutGrid } from "@tabler/icons-react"

type Controls = ReturnType<typeof import("@/hooks/use-list-params").default>

type TypeOption = { value: string; label: string }

export default function ListToolbar({ 
  controls, 
  typeOptions, 
  hideType,
  gridCols,
  setGridCols
}: { 
  controls: Controls; 
  typeOptions?: TypeOption[]; 
  hideType?: boolean;
  gridCols?: 1 | 2;
  setGridCols?: (cols: 1 | 2) => void;
}) {
  const defaultTypes: TypeOption[] = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'online', label: 'Online' },
    { value: 'realtime', label: 'Realtime' },
    { value: 'upload', label: 'Upload' },
  ]
  const types = typeOptions || defaultTypes
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card p-1.5 shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari meeting..."
          className="h-9 pl-9 pr-4 bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
          value={controls.searchInput}
          onChange={(e) => controls.setSearchInput(e.target.value)}
        />
      </div>

      <div className="h-5 w-px bg-border/50 hidden md:block"></div>

      <Select value={controls.filter} onValueChange={(v: any) => controls.setFilter(v)}>
        <SelectTrigger className="h-9 w-[160px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
          <SelectValue placeholder="Semua Meeting" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Meeting</SelectItem>
          <SelectItem value="mine">Meeting Saya</SelectItem>
          <SelectItem value="shared">Dibagikan ke Saya</SelectItem>
        </SelectContent>
      </Select>

      <div className="h-5 w-px bg-border/50 hidden md:block"></div>

      <Select value={String(controls.pageSize)} onValueChange={(val: any) => { controls.setPageSize(parseInt(val, 10)) }}>
        <SelectTrigger className="h-9 w-[130px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
          <SelectValue placeholder="Per halaman" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 / halaman</SelectItem>
          <SelectItem value="10">10 / halaman</SelectItem>
          <SelectItem value="20">20 / halaman</SelectItem>
          <SelectItem value="50">50 / halaman</SelectItem>
        </SelectContent>
      </Select>

      {!hideType && (
        <>
          <div className="h-5 w-px bg-border/50 hidden md:block"></div>
          <Select value={controls.type} onValueChange={(val: any) => controls.setType(val)}>
            <SelectTrigger className="h-9 w-[140px] bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:text-foreground font-medium">
              <SelectValue placeholder="Semua Jenis" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {gridCols !== undefined && setGridCols && (
        <>
          <div className="h-5 w-px bg-border/50 hidden md:block mr-1"></div>
          <div className="flex items-center rounded-lg border border-border/40 bg-muted/50 p-0.5">
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${gridCols === 1 ? 'bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              onClick={() => setGridCols(1)}
            >
              <IconList className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${gridCols === 2 ? 'bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              onClick={() => setGridCols(2)}
            >
              <IconLayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
